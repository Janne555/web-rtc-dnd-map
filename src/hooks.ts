import { useSignaling } from "./signalingContext"
import { useEffect } from "react"

const offers: RTCSessionDescription[] = []

function useOffers() {
  const { ws } = useSignaling()
  useEffect(() => {
    
  })
}
