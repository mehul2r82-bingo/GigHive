"use client"

import { useSearchParams,useRouter } from "next/navigation"
import API from "@/services/api"

export default function SubmitWork(){

const search = useSearchParams()
const router = useRouter()

const id = search.get("task")

const submit = async () => {

  try {

    await API.post(`/tasks/${id}/submit/`)

    alert("Work submitted successfully")

    router.push("/")

  } catch (err) {

    console.error(err)

    alert("Failed to submit work")

  }

}

return(

<div className="flex justify-center items-center min-h-screen bg-black text-white">

<button
onClick={submit}
className="bg-orange-500 p-4 rounded"
>

Submit Work

</button>

</div>

)

}