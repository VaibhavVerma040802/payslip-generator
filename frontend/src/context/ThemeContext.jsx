import { createContext, useContext, useEffect, useState } from 'react'

const ThemeContext = createContext()

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('theme') || 'system'
  })

  useEffect(() => {
    const root = document.documentElement

    const applyTheme = (currentTheme) => {
      if (currentTheme === 'dark') {
        root.setAttribute('data-theme', 'dark')
      } else if (currentTheme === 'light') {
        root.removeAttribute('data-theme')
      } else {
        // system
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
        if (prefersDark) {
          root.setAttribute('data-theme', 'dark')
        } else {
          root.removeAttribute('data-theme')
        }
      }
    }

    applyTheme(theme)
    localStorage.setItem('theme', theme)

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handleChange = () => {
      if (theme === 'system') {
        applyTheme('system')
      }
    }

    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [theme])

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  return useContext(ThemeContext)
}
