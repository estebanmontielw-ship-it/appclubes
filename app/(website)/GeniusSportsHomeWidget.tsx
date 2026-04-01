"use client"

import GeniusSportsWidget from "@/components/website/GeniusSportsWidget"

export default function GeniusSportsHomeWidget() {
  return (
    <GeniusSportsWidget
      page="/schedule"
      showNavBar={false}
      showCompetitionChooser={true}
      showMatchFilter={false}
    />
  )
}
