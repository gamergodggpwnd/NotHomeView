# NotHomeView wake word files ("Hey Jarvis")

Loaded only when the wake word is turned on for a device (assistant settings › Wake word · this device). Everything runs in the browser; no audio leaves the device.

| File | Source | License |
|---|---|---|
| `melspectrogram.onnx`, `embedding_model.onnx` | [openWakeWord](https://github.com/dscripka/openWakeWord) v0.5.1 release (feature models, from Google's speech_embedding) | Apache-2.0 (`LICENSE-openwakeword.txt`) |
| `hey_jarvis_v0.1.onnx` | [openWakeWord](https://github.com/dscripka/openWakeWord) v0.5.1 release (pre-trained "hey jarvis") | CC BY-NC-SA 4.0 (non-commercial; attribution: David Scripka / openWakeWord) |
| `ort.wasm.min.mjs`, `ort-wasm-simd-threaded.mjs`, `ort-wasm-simd-threaded.wasm` | [onnxruntime-web](https://www.npmjs.com/package/onnxruntime-web) 1.22.0 (WebAssembly CPU build) | MIT (`LICENSE-onnxruntime-web.txt`) |
