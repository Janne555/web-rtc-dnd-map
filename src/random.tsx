import React, { useEffect, useState, useContext } from 'react'
import { useSignaling } from "./signalingContext"

const OfferContext = React.createContext({
  offers: [] as RTCSessionDescription[]
})

function OfferProvider({ children }: { children: React.ReactNode }) {
  const [offers, setOffers] = useState<RTCSessionDescription[]>([])
  const { ws } = useSignaling()

  useEffect(() => {
    ws.addEventListener('message', event => {
      if (event.data.includes('offer')) {
        try {
          const data = JSON.parse(event.data)
          if (data.type === "offer") {
            setOffers(prev => prev.concat(data))
          }
        } catch { }
      }
    })
  }, [ws])

  return (
    <OfferContext.Provider value={{ offers }}>
      {children}
    </OfferContext.Provider>
  )
}

function useOffers(): RTCSessionDescription[] {
  const { offers } = useContext(OfferContext)
  return offers
}

export {
  OfferProvider,
  useOffers
}