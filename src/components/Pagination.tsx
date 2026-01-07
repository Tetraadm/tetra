'use client'

type PaginationProps = {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
}

export default function Pagination({ currentPage, totalPages, onPageChange }: PaginationProps) {
  if (totalPages <= 1) return null

  const pages = []
  const maxVisible = 5

  let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2))
  let endPage = Math.min(totalPages, startPage + maxVisible - 1)

  if (endPage - startPage < maxVisible - 1) {
    startPage = Math.max(1, endPage - maxVisible + 1)
  }

  for (let i = startPage; i <= endPage; i++) {
    pages.push(i)
  }

  const styles = {
    container: {
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      gap: 8,
      marginTop: 24,
    },
    button: (active: boolean) => ({
      padding: '8px 12px',
      fontSize: 14,
      fontWeight: active ? 600 : 400,
      color: active ? '#fff' : '#64748B',
      background: active ? '#2563EB' : 'white',
      border: '1px solid #E2E8F0',
      borderRadius: 8,
      cursor: active ? 'default' : 'pointer',
    }),
    ellipsis: {
      padding: '8px 12px',
      fontSize: 14,
      color: '#64748B',
    },
  }

  return (
    <div style={styles.container}>
      <button
        style={styles.button(false)}
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
      >
        ← Forrige
      </button>

      {startPage > 1 && (
        <>
          <button style={styles.button(false)} onClick={() => onPageChange(1)}>
            1
          </button>
          {startPage > 2 && <span style={styles.ellipsis}>...</span>}
        </>
      )}

      {pages.map(page => (
        <button
          key={page}
          style={styles.button(page === currentPage)}
          onClick={() => onPageChange(page)}
        >
          {page}
        </button>
      ))}

      {endPage < totalPages && (
        <>
          {endPage < totalPages - 1 && <span style={styles.ellipsis}>...</span>}
          <button style={styles.button(false)} onClick={() => onPageChange(totalPages)}>
            {totalPages}
          </button>
        </>
      )}

      <button
        style={styles.button(false)}
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
      >
        Neste →
      </button>
    </div>
  )
}
