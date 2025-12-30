import '@testing-library/jest-dom'

// Mock Web Speech API
global.speechSynthesis = {
  speak: jest.fn(),
  cancel: jest.fn(),
  pause: jest.fn(),
  resume: jest.fn(),
  getVoices: jest.fn(() => []),
  onvoiceschanged: null,
  paused: false,
  pending: false,
  speaking: false,
}

global.SpeechSynthesisUtterance = jest.fn().mockImplementation((text) => ({
  text,
  lang: 'en-US',
  rate: 1,
  pitch: 1,
  volume: 1,
}))

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
}
global.localStorage = localStorageMock

// Mock navigator.vibrate
Object.defineProperty(navigator, 'vibrate', {
  value: jest.fn(),
  writable: true,
})

// Suppress console errors in tests
const originalError = console.error
beforeAll(() => {
  console.error = (...args) => {
    if (
      typeof args[0] === 'string' &&
      args[0].includes('Warning: ReactDOM.render')
    ) {
      return
    }
    originalError.call(console, ...args)
  }
})

afterAll(() => {
  console.error = originalError
})
