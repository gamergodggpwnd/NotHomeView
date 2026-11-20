# NotHomeView wake word files ("Hey Jarvis", "Hey Homey")

Loaded only when a wake word is turned on for a device (assistant settings › Wake word · this device, or Settings › Assistant & timer › Wake word). Everything runs in the browser; no audio leaves the device.

| File | Source | License |
|---|---|---|
| `melspectrogram.onnx`, `embedding_model.onnx` | [openWakeWord](https://github.com/dscripka/openWakeWord) v0.5.1 release (feature models, from Google's speech_embedding) | Apache-2.0 (`LICENSE-openwakeword.txt`) |
| `hey_jarvis_v0.1.onnx` | [openWakeWord](https://github.com/dscripka/openWakeWord) v0.5.1 release (pre-trained "hey jarvis") | [CC BY-NC-SA 4.0](https://creativecommons.org/licenses/by-nc-sa/4.0/) (non-commercial; attribution: David Scripka / openWakeWord; included unmodified) |
| `hey_homey.onnx` | **Not included yet.** An openWakeWord model trained for "hey homey", "hey homie" and "homie" (see below) | Set by whoever trains it; note it here when it is added |
| `ort.wasm.min.mjs`, `ort-wasm-simd-threaded.mjs`, `ort-wasm-simd-threaded.wasm` | [onnxruntime-web](https://www.npmjs.com/package/onnxruntime-web) 1.22.0 (WebAssembly CPU build) | MIT (`LICENSE-onnxruntime-web.txt`) |

## "Hey Homey" (also "Hey Homie" and "Homie")

The Hey Homey toggle runs its own wake word head next to Hey Jarvis, on the same `melspectrogram.onnx` + `embedding_model.onnx` features. It needs a model that was actually trained for those phrases. The Hey Jarvis model only hears "Hey Jarvis" and is never used for Homey. There is no pre-trained Homey / Homie model in openWakeWord or in the [community collection](https://github.com/fwartner/home-assistant-wakewords-collection) (the closest, `yo_homie` and `choo_choo_homie`, are different phrases), so the file has to be trained once.

Until `hey_homey.onnx` is here, the toggle shows "Needs its wake word model" and stays off. Hey Jarvis keeps working as before.

To make it:

1. Train an openWakeWord model with the target phrases `hey homey`, `hey homie` and `homie` in one model. Two ways to do that:
   - openWakeWord's automatic training notebook (`notebooks/automatic_model_training.ipynb` in the openWakeWord repository). It generates the spoken examples with Piper TTS and trains against openWakeWord's negative feature set. A Google Colab GPU session takes about an hour.
   - The Home Assistant community's local trainer ([openwakeword-train](https://community.home-assistant.io/t/tool-openwakeword-train-train-your-own-wake-words-locally-tts-examples-real-mic-negatives-onnx-tflite-export/1026289)), which can add your own recordings.
2. Export it as ONNX. Keep openWakeWord's default of 16 embedding frames: the browser reads the model's input size and handles up to 32.
3. Save it as `dist/wakeword/hey_homey.onnx`, next to `hey_jarvis_v0.1.onnx`.
4. Fill in its row in the table above: who trained it, the openWakeWord version, and its licence (the training data's terms apply; Piper voices and openWakeWord's negative data carry their own licences).

Test it with the sensitivity setting in the assistant's own settings. "Homie" on its own is a short phrase, so it can give more false starts than "Hey Homey"; if so, train it with more negative examples or raise the threshold (Low sensitivity).
