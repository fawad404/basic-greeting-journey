import React from "react"
import { Routes, Route } from "react-router-dom"
import TopUpRequests from "./TopUpRequests"
import ReplacementRequests from "./ReplacementRequests"
import ChangeAccessRequests from "./ChangeAccessRequests"

export default function Requests() {
  return (
    <Routes>
      <Route path="/topup" element={<TopUpRequests />} />
      <Route path="/replacement" element={<ReplacementRequests />} />
      <Route path="/change-access" element={<ChangeAccessRequests />} />
      <Route path="/*" element={<TopUpRequests />} />
    </Routes>
  )
}