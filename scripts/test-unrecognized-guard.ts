import { parseVoiceCommand } from '../src/lib/voice-commands'

const cases = [
  'You',
  'the',
  'yeah',
  'okay',
  '',
  'discard',
  'read the draft',
  'make it more formal',
  'please add a note about the delay',
  'tell them the invoice is overdue',
]

for (const c of cases) {
  const result = parseVoiceCommand(c)
  console.log(JSON.stringify(c).padEnd(45), '->', result.action)
}
