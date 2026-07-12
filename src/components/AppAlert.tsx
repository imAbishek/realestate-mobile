import { useEffect, useState } from 'react'
import { InfoSheet } from './InfoSheet'

interface AlertContent { title: string; body: string; onDone?: () => void }

// Module-level presenter registered by AppAlertHost (mounted once at root),
// so call sites stay one-liners instead of each screen owning sheet state.
let present: (c: AlertContent) => void = () => {}

/** Themed drop-in for Alert.alert(title, body) — shows the branded InfoSheet.
 *  Optional onDone runs after the sheet is dismissed (replaces the OK onPress). */
export function appAlert(title: string, body = '', onDone?: () => void) {
  present({ title, body, onDone })
}

export function AppAlertHost() {
  const [content, setContent] = useState<AlertContent | null>(null)
  useEffect(() => {
    present = setContent
    return () => { present = () => {} }
  }, [])
  const close = () => {
    content?.onDone?.()
    setContent(null)
  }
  return (
    <InfoSheet
      visible={content !== null}
      onClose={close}
      icon="information-circle-outline"
      title={content?.title ?? ''}
      body={content?.body ?? ''}
    />
  )
}
