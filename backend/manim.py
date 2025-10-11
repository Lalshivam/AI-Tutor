from manim import Scene, Text, Circle, Square, Triangle, Create, Write, Rotate, FadeIn, FadeOut, MoveToTarget, UP, DOWN, LEFT, RIGHT, WHITE, BLUE, YELLOW, RED, GREEN, PI
import json, math, sys

# --- Load JSON ---
try:
    with open("scene.json", "r", encoding="utf-8") as f:
        data = f.read().strip()
        if data.startswith('"') or data.startswith("'"):
            data = json.loads(data)
        spec = json.loads(data)
except Exception as e:
    print(f"[ERROR] Could not load scene.json: {e}")
    sys.exit(1)

class GeneratedScene(Scene):
    def construct(self):
        objects = []

        # --- Build objects ---
        for i, obj in enumerate(spec.get("objects", [])):
            mobj = None
            obj_type = obj.get("type", "").lower()
            opts = obj.get("options", {})

            if obj_type == "text":
                mobj = Text(
                    obj.get("content", ""),
                    color=opts.get("color", WHITE),
                    font_size=opts.get("font_size", 36)
                ).move_to(obj.get("position", [0, 0, 0]))

            elif obj_type == "circle":
                mobj = Circle(
                    radius=obj.get("radius", 1),
                    color=opts.get("color", BLUE)
                ).move_to(obj.get("position", [0, 0, 0]))

            elif obj_type == "square":
                mobj = Square(
                    side_length=obj.get("side", 1),
                    color=opts.get("color", YELLOW)
                ).move_to(obj.get("position", [0, 0, 0]))

            else:
                print(f"[WARN] Unknown object type '{obj_type}' — skipping")
                continue

            objects.append(mobj)
            self.add(mobj)  # keep it in the scene (important)

        # --- Animation section ---
        for anim in spec.get("animations", []):
            try:
                idx = int(anim["target"].replace("object", ""))
                target = objects[idx]
                action = anim["action"].lower()

                if action == "write":
                    self.play(Write(target))
                elif action == "create":
                    self.play(Create(target))
                elif action == "rotate":
                    angle_expr = anim.get("angle", "0")
                    angle = eval(angle_expr, {"math": math, "PI": math.pi, "pi": math.pi})
                    self.play(Rotate(target, angle=angle))
                elif action == "move_to":
                    pos = anim.get("position", [0, 0, 0])
                    self.play(target.animate.move_to(pos))
                elif action == "scale":
                    factor = anim.get("factor", 1.0)
                    self.play(target.animate.scale(factor))
                elif action == "fadeout":
                    self.play(FadeOut(target))
                elif action == "fadein":
                    self.play(FadeIn(target))
                elif action == "changecolor":
                    color = anim.get("color", YELLOW)
                    self.play(target.animate.set_color(color))
                elif action == "wait":
                    self.wait(anim.get("duration", 1))
                else:
                    print(f"[WARN] Unknown animation action '{action}'")

            except Exception as e:
                print(f"[ERROR] Animation failed: {e}")

        self.wait(2)
