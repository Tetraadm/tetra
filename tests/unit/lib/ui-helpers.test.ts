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
        expect(result.border).toBe(colors.dangerBorder)
    })


    it('should return warning colors for medium severity', () => {
        const result = severityColor('medium')
        expect(result.bg).toBe(colors.warningLight)
        expect(result.color).toBe(colors.warning)
        expect(result.border).toBe(colors.warningBorder)
    })

    it('should return info colors for low severity', () => {
        const result = severityColor('low')
        expect(result.bg).toBe(colors.infoLight)
        expect(result.color).toBe(colors.info)
        expect(result.border).toBe(colors.infoBorder)
    })

    it('should return info colors for unknown severity (default)', () => {
        const result = severityColor('unknown')
        expect(result.bg).toBe(colors.infoLight)
        expect(result.color).toBe(colors.info)
        expect(result.border).toBe(colors.infoBorder)
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
        expect(result.border).toBe(colors.successBorder)
    })

    it('should return warning colors for draft status', () => {
        const result = statusColor('draft')
        expect(result.bg).toBe(colors.warningLight)
        expect(result.color).toBe(colors.warning)
        expect(result.border).toBe(colors.warningBorder)
    })

    it('should return warning colors for unknown status (default to draft styling)', () => {
        const result = statusColor('unknown')
        expect(result.bg).toBe(colors.warningLight)
        expect(result.color).toBe(colors.warning)
        expect(result.border).toBe(colors.warningBorder)
    })
})
