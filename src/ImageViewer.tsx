import React, { useEffect, useRef, useCallback } from 'react'
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
  const messageHandler = useCallback(function (event: MessageEvent) {
    const data = JSON.parse(event.data)
    if (data.type === "brush-size") {
      brushSize.brushX = data.brushX * canvas.width
      brushSize.brushY = data.brushY * canvas.height
    }
    if (data.type === "coords") {
      const ctx = canvas.getContext("2d")!
      const x = data.x * canvas.width
      const y = data.y * canvas.height
      ctx.clearRect(x - brushSize.brushX / 2, y - brushSize.brushY / 2, brushSize.brushX, brushSize.brushY)
    }
  }, [canvas])

  const handleMouseMove = useCallback(function ({ offsetX, offsetY }: MouseEvent) {
    if (brush.current) {
      brush.current.style.display = 'block'
      const top = offsetY - brushSize.brushY / 2
      const left = offsetX - brushSize.brushX / 2
      brush.current.style.top = `${top < 0 ? 0 : top + brushSize.brushY > canvas.height ? canvas.height - brushSize.brushY : top}px`
      brush.current.style.left = `${left < 0 ? 0 : left + brushSize.brushX > canvas.width ? canvas.width - brushSize.brushX : left}px`
      brush.current.style.width = `${brushSize.brushX}px`
      brush.current.style.height = `${brushSize.brushY}px`
    }
    const { current: { prevX, prevY } } = prevCoords
    if (mouseDown.current && prevX !== offsetX && prevY !== offsetY) {
      dataChannel?.send(JSON.stringify({ x: offsetX / canvas.width, y: offsetY / canvas.height, type: "coords" }))
      const ctx = canvas.getContext("2d")!
      ctx.clearRect(offsetX - brushSize.brushX / 2, offsetY - brushSize.brushY / 2, brushSize.brushX, brushSize.brushY)
      prevCoords.current = { prevX: offsetX, prevY: offsetY }
    }
  }, [canvas, dataChannel])

  useEffect(() => {
    const image = new Image()
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
        const brushX = brushSize.brushX / canvas.width
        const brushY = brushSize.brushY / canvas.height
        dataChannel?.send(JSON.stringify({ type: 'brush-size', brushX, brushY }))

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

    image.onresize = console.log

    image.src = URL.createObjectURL(file)

    return () => {
      canvas.remove()
      image.remove()
    }
  }, [file, canvas, dataChannel, handleMouseMove, mode])


  useEffect(() => {
    if (dataChannel && mode === 'client') {
      dataChannel.addEventListener('message', messageHandler)
    }

    return () => {
      dataChannel?.removeEventListener('message', messageHandler)
    }
  }, [dataChannel, mode, messageHandler])



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