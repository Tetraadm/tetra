import type { AiLog, Instruction } from '@/lib/types'
import type { createAdminStyles } from '../styles'

type Props = {
  aiLogs: AiLog[]
  instructions: Instruction[]
  styles: ReturnType<typeof createAdminStyles>
}

export default function InsightsTab({ aiLogs, instructions, styles }: Props) {
  return (
    <>
      <h1 style={styles.pageTitle}>Innsikt</h1>
      <p style={styles.pageSubtitle}>Statistikk og analyse</p>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div style={styles.card}>
          <div style={styles.cardHeader}>AI-bruk</div>
          <div style={styles.cardBody}>
            <div style={styles.statValue}>{aiLogs.length}</div>
            <div style={styles.statLabel}>Totalt antall spørsmål</div>
          </div>
        </div>
        <div style={styles.card}>
          <div style={styles.cardHeader}>Dokumenter</div>
          <div style={styles.cardBody}>
            <div style={styles.statValue}>{instructions.filter(i => i.status === 'published').length}</div>
            <div style={styles.statLabel}>Publiserte instrukser</div>
          </div>
        </div>
      </div>
    </>
  )
}
