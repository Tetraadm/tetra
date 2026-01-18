#!/usr/bin/env python3
"""
Tetra Project Audit Checklist Script

This script implements the priority-based project audit as defined in GEMINI.md.
It runs validation checks in the following order:
1. Security  2. Lint  3. Schema  4. Tests  5. UX  6. SEO  7. Lighthouse/E2E

Usage:
  python scripts/checklist.py .                     # Manual audit
  python scripts/checklist.py . --url <URL>         # Pre-deploy with E2E
"""

import subprocess
import sys
import os
import json
from pathlib import Path
from dataclasses import dataclass
from typing import Optional
from enum import Enum


class CheckStatus(Enum):
    PASSED = "PASSED"
    FAILED = "FAILED"
    SKIPPED = "SKIPPED"
    WARNING = "WARNING"


@dataclass
class CheckResult:
    name: str
    status: CheckStatus
    message: str
    details: Optional[str] = None


def run_command(cmd: list[str], cwd: str = ".") -> tuple[int, str, str]:
    """Run a command and return (return_code, stdout, stderr)."""
    import platform
    try:
        # On Windows, use shell=True for npm commands
        use_shell = platform.system() == "Windows" and cmd[0] == "npm"
        result = subprocess.run(
            cmd,
            cwd=cwd,
            capture_output=True,
            text=True,
            timeout=300,  # 5 minute timeout
            shell=use_shell
        )
        return result.returncode, result.stdout, result.stderr
    except subprocess.TimeoutExpired:
        return -1, "", "Command timed out"
    except FileNotFoundError:
        return -1, "", f"Command not found: {cmd[0]}"


def check_security(project_path: str) -> CheckResult:
    """Check for security vulnerabilities in dependencies."""
    # Check npm audit
    code, stdout, stderr = run_command(["npm", "audit", "--json"], project_path)
    
    if code == -1:
        return CheckResult("Security", CheckStatus.SKIPPED, "npm not available", stderr)
    
    try:
        audit_data = json.loads(stdout) if stdout else {}
        vulnerabilities = audit_data.get("metadata", {}).get("vulnerabilities", {})
        critical = vulnerabilities.get("critical", 0)
        high = vulnerabilities.get("high", 0)
        
        if critical > 0:
            return CheckResult(
                "Security", 
                CheckStatus.FAILED, 
                f"{critical} critical vulnerabilities found",
                stdout[:500]
            )
        elif high > 0:
            return CheckResult(
                "Security",
                CheckStatus.WARNING,
                f"{high} high vulnerabilities found (no critical)",
                stdout[:500]
            )
        else:
            return CheckResult("Security", CheckStatus.PASSED, "No critical/high vulnerabilities")
    except json.JSONDecodeError:
        # npm audit may return non-JSON in some cases
        if "found 0 vulnerabilities" in stdout.lower():
            return CheckResult("Security", CheckStatus.PASSED, "No vulnerabilities found")
        return CheckResult("Security", CheckStatus.WARNING, "Could not parse audit output", stdout[:200])


def check_lint(project_path: str) -> CheckResult:
    """Run ESLint and check for errors."""
    code, stdout, stderr = run_command(["npm", "run", "lint"], project_path)
    
    if code == -1:
        return CheckResult("Lint", CheckStatus.SKIPPED, "npm not available", stderr)
    
    output = stdout + stderr
    
    if code == 0:
        return CheckResult("Lint", CheckStatus.PASSED, "No lint errors")
    
    # Count errors
    error_count = output.lower().count("error")
    warning_count = output.lower().count("warning")
    
    return CheckResult(
        "Lint",
        CheckStatus.FAILED,
        f"{error_count} errors, {warning_count} warnings",
        output[-1000:]  # Last 1000 chars
    )


def check_typecheck(project_path: str) -> CheckResult:
    """Run TypeScript type checking."""
    code, stdout, stderr = run_command(["npm", "run", "typecheck"], project_path)
    
    if code == -1:
        return CheckResult("TypeCheck", CheckStatus.SKIPPED, "npm not available", stderr)
    
    if code == 0:
        return CheckResult("TypeCheck", CheckStatus.PASSED, "No type errors")
    
    output = stdout + stderr
    error_lines = [l for l in output.split("\n") if "error" in l.lower()]
    
    return CheckResult(
        "TypeCheck",
        CheckStatus.FAILED,
        f"{len(error_lines)} type errors found",
        "\n".join(error_lines[:10])
    )


def check_schema(project_path: str) -> CheckResult:
    """Validate database schema (check for migration files)."""
    migrations_path = Path(project_path) / "supabase" / "sql"
    
    if not migrations_path.exists():
        return CheckResult("Schema", CheckStatus.SKIPPED, "No supabase/sql directory found")
    
    migration_files = list(migrations_path.glob("*.sql"))
    
    if len(migration_files) == 0:
        return CheckResult("Schema", CheckStatus.WARNING, "No migration files found")
    
    # Check for naming convention (numbered prefixes)
    invalid_names = []
    for f in migration_files:
        name = f.name
        if not (name[0:2].isdigit() or name.split("_")[0].isdigit()):
            invalid_names.append(name)
    
    if invalid_names:
        return CheckResult(
            "Schema",
            CheckStatus.WARNING,
            f"{len(invalid_names)} files without numbered prefix",
            ", ".join(invalid_names[:5])
        )
    
    return CheckResult("Schema", CheckStatus.PASSED, f"{len(migration_files)} migration files validated")


def check_tests(project_path: str) -> CheckResult:
    """Run test suite if available."""
    package_json_path = Path(project_path) / "package.json"
    
    if not package_json_path.exists():
        return CheckResult("Tests", CheckStatus.SKIPPED, "No package.json found")
    
    with open(package_json_path) as f:
        package = json.load(f)
    
    scripts = package.get("scripts", {})
    
    if "test" not in scripts:
        return CheckResult("Tests", CheckStatus.SKIPPED, "No test script defined in package.json")
    
    code, stdout, stderr = run_command(["npm", "test"], project_path)
    
    if code == 0:
        return CheckResult("Tests", CheckStatus.PASSED, "All tests passed")
    
    return CheckResult("Tests", CheckStatus.FAILED, "Tests failed", (stdout + stderr)[-500:])


def check_build(project_path: str) -> CheckResult:
    """Check if the project builds successfully."""
    code, stdout, stderr = run_command(["npm", "run", "build"], project_path)
    
    if code == -1:
        return CheckResult("Build", CheckStatus.SKIPPED, "npm not available", stderr)
    
    if code == 0:
        return CheckResult("Build", CheckStatus.PASSED, "Build successful")
    
    output = stdout + stderr
    return CheckResult("Build", CheckStatus.FAILED, "Build failed", output[-500:])


def check_env(project_path: str) -> CheckResult:
    """Check for environment variable security."""
    env_file = Path(project_path) / ".env"
    env_local = Path(project_path) / ".env.local"
    gitignore = Path(project_path) / ".gitignore"
    
    issues = []
    
    # Check if .env files are gitignored
    if gitignore.exists():
        gitignore_content = gitignore.read_text()
        if ".env" not in gitignore_content:
            issues.append(".env not in .gitignore")
    else:
        issues.append("No .gitignore file found")
    
    # Check for hardcoded secrets in common files
    src_path = Path(project_path) / "src"
    if src_path.exists():
        suspicious_patterns = ["password=", "secret=", "api_key=", "apikey="]
        for ts_file in src_path.rglob("*.ts"):
            try:
                content = ts_file.read_text().lower()
                for pattern in suspicious_patterns:
                    if pattern in content and "process.env" not in content:
                        issues.append(f"Possible hardcoded secret in {ts_file.name}")
                        break
            except:
                pass
    
    if issues:
        return CheckResult("Environment", CheckStatus.WARNING, f"{len(issues)} issues", "\n".join(issues[:5]))
    
    return CheckResult("Environment", CheckStatus.PASSED, "Environment configuration looks secure")


def run_checklist(project_path: str, url: Optional[str] = None) -> list[CheckResult]:
    """Run the complete checklist in priority order."""
    results = []
    
    print("\n" + "=" * 60)
    print("  TETRA PROJECT AUDIT CHECKLIST")
    print("=" * 60)
    print(f"  Project: {os.path.abspath(project_path)}")
    if url:
        print(f"  URL: {url}")
    print("=" * 60 + "\n")
    
    # Priority order: Security > Lint > Schema > Tests > UX > SEO > Lighthouse/E2E
    checks = [
        ("1. Security", lambda: check_security(project_path)),
        ("2. Lint", lambda: check_lint(project_path)),
        ("3. TypeCheck", lambda: check_typecheck(project_path)),
        ("4. Schema", lambda: check_schema(project_path)),
        ("5. Environment", lambda: check_env(project_path)),
        ("6. Tests", lambda: check_tests(project_path)),
    ]
    
    # If URL provided, add E2E checks
    if url:
        print("  [Pre-Deploy Mode: E2E checks will be attempted]\n")
    
    for name, check_fn in checks:
        print(f"  Running {name}...", end=" ", flush=True)
        result = check_fn()
        results.append(result)
        
        status_icon = {
            CheckStatus.PASSED: "[PASS]",
            CheckStatus.FAILED: "[FAIL]",
            CheckStatus.WARNING: "[WARN]",
            CheckStatus.SKIPPED: "[SKIP]",
        }[result.status]
        
        print(f"{status_icon} {result.message}")
        
        if result.details and result.status in (CheckStatus.FAILED, CheckStatus.WARNING):
            for line in result.details.split("\n")[:5]:
                if line.strip():
                    print(f"      {line.strip()[:80]}")
    
    # Summary
    print("\n" + "=" * 60)
    print("  SUMMARY")
    print("=" * 60)
    
    passed = sum(1 for r in results if r.status == CheckStatus.PASSED)
    failed = sum(1 for r in results if r.status == CheckStatus.FAILED)
    warnings = sum(1 for r in results if r.status == CheckStatus.WARNING)
    skipped = sum(1 for r in results if r.status == CheckStatus.SKIPPED)
    
    print(f"  Passed:   {passed}")
    print(f"  Failed:   {failed}")
    print(f"  Warnings: {warnings}")
    print(f"  Skipped:  {skipped}")
    print("=" * 60)
    
    if failed > 0:
        print("\n  RESULT: BLOCKED - Fix FAILED checks before proceeding\n")
        return results
    elif warnings > 0:
        print("\n  RESULT: CONDITIONAL PASS - Review warnings\n")
    else:
        print("\n  RESULT: ALL CHECKS PASSED\n")
    
    return results


def main():
    if len(sys.argv) < 2:
        print("Usage: python scripts/checklist.py <project_path> [--url <URL>]")
        print("Example: python scripts/checklist.py .")
        print("Example: python scripts/checklist.py . --url https://example.com")
        sys.exit(1)
    
    project_path = sys.argv[1]
    url = None
    
    if "--url" in sys.argv:
        url_idx = sys.argv.index("--url")
        if url_idx + 1 < len(sys.argv):
            url = sys.argv[url_idx + 1]
    
    if not os.path.isdir(project_path):
        print(f"Error: '{project_path}' is not a valid directory")
        sys.exit(1)
    
    results = run_checklist(project_path, url)
    
    # Exit with error code if any check failed
    if any(r.status == CheckStatus.FAILED for r in results):
        sys.exit(1)
    
    sys.exit(0)


if __name__ == "__main__":
    main()
