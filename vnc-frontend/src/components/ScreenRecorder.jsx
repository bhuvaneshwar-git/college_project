import { useRef, useState } from "react";

export default function ScreenRecorder() {
  const mediaRecorderRef = useRef(null);
  const [chunks, setChunks] = useState([]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: false,
      });

      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) setChunks((prev) => [...prev, e.data]);
      };

      recorder.onstop = uploadRecording;

      recorder.start();
      alert("Recording started!");

    } catch (err) {
      console.error("Recording error:", err);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      alert("Recording stopped!");
    }
  };

  const uploadRecording = async () => {
    const blob = new Blob(chunks, { type: "video/webm" });
    const formData = new FormData();
    formData.append("recording", blob, "session.webm");

    await fetch("http://localhost:3001/uploadRecording", {
      method: "POST",
      body: formData,
    });

    alert("Recording uploaded!");
    setChunks([]);
  };

  return (
    <div style={{ margin: "20px 0" }}>
      <button onClick={startRecording} style={{ marginRight: "10px" }}>
        Start Recording
      </button>

      <button onClick={stopRecording}>
        Stop Recording
      </button>
    </div>
  );
}

