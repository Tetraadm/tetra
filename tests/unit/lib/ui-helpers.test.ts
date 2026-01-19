import { describe, it, expect } from 'vitest'
import {
    severityLabel,
    severityColor,
    roleLabel,
    statusColor,
    colors
} from '@/lib/ui-helpers'

describe('severityLabel', () => {
    it('should return Kritisk for critical severity', () => {
        expect(severityLabel('critical')).toBe('Kritisk')
    })

    it('should return Hoy for high severity', () => {
        expect(severityLabel('high')).toBe('Hoy')
    })

    it('should return Middels for medium severity', () => {
        expect(severityLabel('medium')).toBe('Middels')
    })

    it('should return Lav for low severity', () => {
        expect(severityLabel('low')).toBe('Lav')
    })

    it('should return Ukjent for unknown severity', () => {
        expect(severityLabel('unknown')).toBe('Ukjent')
        expect(severityLabel('')).toBe('Ukjent')
    })
})

describe('severityColor', () => {
    it('should return danger colors for critical severity', () => {
        const result = severityColor('critical')
        expect(result.bg).toBe(colors.dangerLight)
        expect(result.color).toBe(colors.danger)
    })

    it('should return high colors for high severity', () => {
        const result = severityColor('high')
        expect(result.bg).toBe(colors.highLight)
        expect(result.color).toBe(colors.high)
    })

    it('should return warning colors for medium severity', () => {
        const result = severityColor('medium')
        expect(result.bg).toBe(colors.warningLight)
        expect(result.color).toBe(colors.warning)
    })

    it('should return success colors for low severity', () => {
        const result = severityColor('low')
        expect(result.bg).toBe(colors.successLight)
        expect(result.color).toBe(colors.success)
    })

    it('should return success colors for unknown severity (default)', () => {
        const result = severityColor('unknown')
        expect(result.bg).toBe(colors.successLight)
        expect(result.color).toBe(colors.success)
    })
})

describe('roleLabel', () => {
    it('should return Sikkerhetsansvarlig for admin role', () => {
        expect(roleLabel('admin')).toBe('Sikkerhetsansvarlig')
    })

    it('should return Teamleder for teamleader role', () => {
        expect(roleLabel('teamleader')).toBe('Teamleder')
    })

    it('should return Ansatt for employee role', () => {
        expect(roleLabel('employee')).toBe('Ansatt')
    })

    it('should return Ukjent for unknown role', () => {
        expect(roleLabel('unknown')).toBe('Ukjent')
    })
})

describe('statusColor', () => {
    it('should return success colors for published status', () => {
        const result = statusColor('published')
        expect(result.bg).toBe(colors.successLight)
        expect(result.color).toBe(colors.success)
    })

    it('should return warning colors for draft status', () => {
        const result = statusColor('draft')
        expect(result.bg).toBe(colors.warningLight)
        expect(result.color).toBe(colors.warning)
    })

    it('should return muted colors for archived status', () => {
        const result = statusColor('archived')
        expect(result.bg).toBe(colors.backgroundSubtle)
        expect(result.color).toBe(colors.textMuted)
    })

    it('should return secondary colors for unknown status', () => {
        const result = statusColor('unknown')
        expect(result.bg).toBe(colors.backgroundSubtle)
        expect(result.color).toBe(colors.textSecondary)
    })
})
