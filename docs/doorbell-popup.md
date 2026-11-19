# Doorbell & motion pop-up

On the **Home - Pixel** dashboard only (`url_path` `home-vertical-tablet`), NotHomeView can show a doorbell camera live when someone rings, and (during the screensaver) when the camera sees motion. Every other dashboard ignores the event (no pop-up).

| Situation | What appears |
|---|---|
| Doorbell rings, screen awake | On Home - Pixel: the camera live, **full screen** (purple), closes after 60 s, or with ✕ / *Dismiss*. *Muted* turns the stream's sound on. |
| Doorbell rings during the Wallpanel screensaver | A small **corner pop-up** (top right, purple). Tap it for full screen (the screensaver stays); waking the screen also opens it full screen. |
| Motion / person during the screensaver | The corner pop-up in **orange**, muted, closes 45 s after the last motion event; then no motion pop-up for 5 minutes. |
| Motion while the screen is awake | Nothing. |

A still picture (the tile's last live frame, the camera's last event image, or the last frame you watched) shows at once while the stream starts (Nest: usually 2-8 s). Only one stream per camera: an *Always live* tile of the same camera pauses while the pop-up is open. If the camera's API refuses the stream (Google Nest: rate limit / 429), the still picture stays with *Snapshot*.

**Per device:** open the camera's large view and use the **Pop-ups** button: *Pop-ups on → Doorbell only → Motion only → Pop-ups off* (this camera, this browser only; default on). `show_device_popup: false` hides the button.

## The automation

The dashboards react to the Home Assistant event `nothomeview_doorbell`:

```yaml
kind: ring            # or motion
camera: camera.front_door
event_type: ring      # optional: camera_person / camera_motion (shown as "Person" / "Motion")
```

Home Assistant only lets **admin** users subscribe to custom events, so the automation also writes each event into a text helper that every user's dashboard can see. Create the helper first: *Settings → Devices & services → Helpers → Create helper → Text*, name **NotHomeView doorbell** (entity `input_text.nothomeview_doorbell`, max length 255).

```yaml
alias: "NotHomeView: doorbell & motion pop-up"
mode: queued
triggers:
  - trigger: state
    entity_id: event.front_door_chime        # your doorbell's event entity (device class doorbell)
    id: ring
    not_from: [unavailable]
    not_to: [unavailable, unknown]
  - trigger: state
    entity_id: event.front_door_motion       # optional: the camera's motion event entity
    id: motion
    not_from: [unavailable]
    not_to: [unavailable, unknown]
  - trigger: event
    event_type: nothomeview_doorbell
    id: relay
actions:
  - choose:
      - conditions:
          - condition: trigger
            id: ring
          - "{{ trigger.to_state.attributes.event_type == 'ring' }}"
        sequence:
          - event: nothomeview_doorbell
            event_data: { kind: ring, camera: camera.front_door, event_type: ring }
      - conditions:
          - condition: trigger
            id: motion
          - "{{ trigger.to_state.attributes.event_type in ['camera_motion', 'camera_person'] }}"
        sequence:
          - event: nothomeview_doorbell
            event_data:
              kind: motion
              camera: camera.front_door
              event_type: "{{ trigger.to_state.attributes.event_type }}"
      - conditions:
          - condition: trigger
            id: relay
          - "{{ trigger.event.data.kind in ['ring', 'motion'] and states('input_text.nothomeview_doorbell') != 'unavailable' }}"
        sequence:
          - action: input_text.set_value
            target: { entity_id: input_text.nothomeview_doorbell }
            data:
              value: "{{ trigger.event.data.kind }}|{{ trigger.event.data.camera }}|{{ trigger.event.context.id }}|{{ trigger.event.data.event_type | default(trigger.event.data.kind) }}"
```

Test without ringing: *Developer tools → Events*, event type `nothomeview_doorbell`, data `kind: ring` and `camera: camera.front_door`. In the browser console, `NotHomeView.doorbell.status()` shows what the dashboard received and why it did or didn't show a pop-up; `NotHomeView.doorbell.show('ring', 'camera.front_door')` previews the pop-up on that device only.

Notes: the pop-up appears only when Home - Pixel is open on that device (other dashboards never show it). Nest limits streams per account. "Motion stops" means no new motion event from the camera; most cameras send a new event at most every 30-60 s while motion continues.
