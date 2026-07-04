import { create } from 'zustand'

interface TTSState {
  isPlaying: boolean
  activeText: string | null
  speak: (text: string, lang?: string) => void
  stop: () => void
}

export const useTTSStore = create<TTSState>((set, get) => {
  return {
    isPlaying: false,
    activeText: null,

    stop: () => {
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel()
      }
      set({ isPlaying: false, activeText: null })
    },

    speak: (text: string, lang?: string) => {
      if (typeof window === 'undefined' || !window.speechSynthesis) {
        console.warn('Speech synthesis not supported in this environment')
        return
      }

      const { stop } = get()
      stop() // Stop any current speech

      set({ isPlaying: true, activeText: text })

      // Create a clean utterance without HTML tags to prevent reading markup
      const cleanText = text.replace(/<[^>]*>/g, '').trim()
      if (!cleanText) {
        set({ isPlaying: false, activeText: null })
        return
      }

      const utterance = new SpeechSynthesisUtterance(cleanText)
      if (lang) {
        utterance.lang = lang
      }

      utterance.onend = () => {
        if (get().activeText === text) {
          set({ isPlaying: false, activeText: null })
        }
      }

      utterance.onerror = () => {
        if (get().activeText === text) {
          set({ isPlaying: false, activeText: null })
        }
      }

      window.speechSynthesis.speak(utterance)
    }
  }
})
