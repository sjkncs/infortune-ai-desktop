#!/usr/bin/env node
import('./index.js').catch(err => {
  console.error('Server failed to start:', err)
  process.exit(1)
})
