import { useEffect, useRef, useState } from "react"
import { usePeerConnection } from "./PeerConnectionContext"

function* makeFileReceiver() {
  const type: string = yield
  const name: string = yield
  let buffers: ArrayBuffer[] = []
  let time = Date.now()
  while (true) {
    if (Date.now() - time > 1000) {
      throw Error('timeout')
    }
    const data = yield
    if (data === 'done') {
      break
    } else {
      buffers.push(data)
    }
  }
  return new File(buffers, name, { type })
}

function useFileSending() {
  const { peerConnection, mode } = usePeerConnection()
  const fileDataChannel = useRef<RTCDataChannel>()
  const fileReceiver = useRef(makeFileReceiver())
  const [file, setFile] = useState<File>()

  useEffect(() => {
    peerConnection.addEventListener('datachannel', event => {
      if (event.channel.label === 'file') {
        fileDataChannel.current = event.channel

        event.channel.addEventListener('open', event => {
          fileReceiver.current = makeFileReceiver()
          fileReceiver.current.next()
        })

        event.channel.addEventListener('message', event => {
          if (fileReceiver.current) {
            console.log(event.data)
            const result = fileReceiver.current.next(event.data)
            if (result.done) {
              setFile(result.value)
            }
          }
        })

        event.channel.addEventListener('close', event => {
          fileReceiver.current = makeFileReceiver()
          fileDataChannel.current = undefined
        })
      }
    })
  }, [])

  async function sendFile(file: File) {
    if (mode !== 'host') {
      throw Error(`Invalid mode for file sending: ${mode}`)
    }

    fileDataChannel.current = peerConnection.createDataChannel('file')

    fileDataChannel.current.addEventListener('open', () => {
      const fileReader = new FileReader()
      let offset = 0

      fileReader.addEventListener('load', e => {
        if (e.target?.result && e.target.result instanceof ArrayBuffer) {
          fileDataChannel.current?.send(e.target.result)
          offset += e.target.result.byteLength
          if (offset < file.size) {
            readSlice()
          } else {
            fileDataChannel.current?.send("done")
          }
        }
      })


      const readSlice = () => {
        if (file) {
          const slice = file.slice(offset, offset + 16384)
          fileReader.readAsArrayBuffer(slice)
        }
      }

      fileDataChannel.current?.send(file.type)
      fileDataChannel.current?.send(file.name)
      readSlice()
    })
  }

  return {
    sendFile,
    file
  }
}


export {
  useFileSending
}