import React, { useEffect, useRef, useState } from 'react'
import { usePeerConnection } from './PeerConnectionContext'
import ReactDOM from 'react-dom'
import { brush as brushSize } from './App'

type Props = {
  file: File,
}

function ImageViewer({ file }: Props) {
  const { current: canvas } = useRef(document.createElement('canvas'))
  const brush = useRef<HTMLDivElement>(null)
  const { dataChannel, mode } = usePeerConnection()
  const mouseDown = useRef(false)
  const prevCoords = useRef({ prevX: 0, prevY: 0 })

  useEffect(() => {
    const image = new Image
    image.onload = () => {
      document.getElementById('container')?.appendChild(image)
      const context = canvas.getContext("2d")!
      canvas.height = image.height
      canvas.width = image.width
      context.rect(0, 0, image.width, image.height)
      context.fillStyle = mode === 'host' ? 'rgba(255, 0, 0, 0.2)' : 'rgb(0, 0, 0)'
      context.fill()
      document.getElementById('container')?.appendChild(canvas)
      URL.revokeObjectURL(image.src)

      if (mode === "host") {
        canvas.addEventListener('mousemove', handleMouseMove)

        canvas.addEventListener('mousedown', e => {
          mouseDown.current = true
          handleMouseMove(e)
        })

        canvas.addEventListener('mouseup', e => {
          mouseDown.current = false
        })

        canvas.addEventListener('mouseenter', handleMouseEnter)
        canvas.addEventListener('mouseleave', handleMouseLeave)
      }
    }

    image.src = URL.createObjectURL(file)

    return () => {
      canvas.remove()
      image.remove()
    }
  }, [file])


  useEffect(() => {
    if (dataChannel && mode === 'client') {
      dataChannel.addEventListener('message', messageHandler)
    }

    return () => {
      dataChannel?.removeEventListener('message', messageHandler)
    }
  }, [dataChannel, mode])

  function messageHandler(event: MessageEvent) {
    const data = JSON.parse(event.data)
    if (data.type === "brush-size") {
      brushSize.size = data.brushSize
    }
    if (data.type === "coords") {
      const ctx = canvas.getContext("2d")!
      ctx.clearRect(data.x - brushSize.size / 2, data.y - brushSize.size / 2, brushSize.size, brushSize.size)
    }
  }

  function handleMouseEnter(event: MouseEvent) {
    if (brush.current) {
      brush.current.style.display = 'block'
    }
  }

  function handleMouseLeave(event: MouseEvent) {
    if (brush.current) {
      brush.current.style.display = 'none'
    }
  }

  function handleMouseMove({ offsetX, offsetY }: MouseEvent) {
    if (brush.current) {
      brush.current.style.display = 'block'
      const top = offsetY - brushSize.size / 2
      const left = offsetX - brushSize.size / 2
      brush.current.style.top = `${top < 0 ? 0 : top + brushSize.size > canvas.height ? canvas.height - brushSize.size : top}px`
      brush.current.style.left = `${left < 0 ? 0 : left + brushSize.size > canvas.width ? canvas.width - brushSize.size : left}px`
      brush.current.style.width = `${brushSize.size}px`
      brush.current.style.height = `${brushSize.size}px`
    }
    const { current: { prevX, prevY } } = prevCoords
    if (mouseDown.current && prevX !== offsetX && prevY !== offsetY) {
      dataChannel?.send(JSON.stringify({ x: offsetX, y: offsetY, type: "coords" }))
      const ctx = canvas.getContext("2d")!
      ctx.clearRect(offsetX - brushSize.size / 2, offsetY - brushSize.size / 2, brushSize.size, brushSize.size)
      prevCoords.current = { prevX: offsetX, prevY: offsetY }
    }
  }

  if (mode === 'client') {
    return ReactDOM.createPortal(<div id="container" className="container client" />, document.getElementById('portal')!)
  }

  return (
    <div id="container" className="container host">
      <div className="brush" ref={brush} />
    </div>
  )
}

export default ImageViewer