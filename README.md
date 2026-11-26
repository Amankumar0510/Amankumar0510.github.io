# Aman Kumar: portfolio website

**Live site:** <https://amankumar0510.github.io/>

Portfolio of an Electronics & Communication Engineering student working on embedded systems, IoT and UAV technology.

## Highlights

- Dark, animated single-page design that adapts to phones and desktops
- Interactive PID lab: a simplified browser simulation of a two-wheeled robot balancing
- Animated signal-network background, oscilloscope traces and project illustrations
- Respects the "reduce motion" system setting, and has a button to pause animations
- Plain HTML, CSS and JavaScript, with no libraries and no build step

## Run locally

```bash
python -m http.server 8000
```

Then open <http://localhost:8000/>.

## Files

| File | Purpose |
|---|---|
| `index.html` | All page content |
| `assets/css/style.css` | Design, animations and responsive layout |
| `assets/js/main.js` | Canvas effects, filters and the PID simulator |
| `assets/img/` | Photo, schematic and icons |

To change the photo, replace `assets/img/photo.jpg` with a square image of the same name.

## Credits

Content and projects by **Aman Kumar**. The self-balancing robot is a team project with Rakesh Pandit and Karan Singh.
