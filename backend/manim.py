from manim import (
    Scene, Text, MathTex, Circle, Square, Rectangle, Line, Arrow, Dot,
    NumberPlane, Axes, VGroup, Create, Write, Rotate, FadeIn, FadeOut,
    Transform, Indicate, Circumscribe, ORIGIN, PI, TAU,
    WHITE, BLUE, YELLOW, RED, GREEN, PINK, ORANGE, PURPLE, GRAY,
    LIGHT_GRAY, DARK_GRAY, UP, DOWN, LEFT, RIGHT, ParametricFunction
)
import json, math, sys
import numpy as np

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
        objects = {}
        
        # --- Build objects ---
        for obj in spec.get("objects", []):
            mobj = None
            obj_id = obj.get("id", "")
            obj_type = obj.get("type", "").lower()
            opts = obj.get("options", {})
            
            if obj_type == "text":
                mobj = Text(
                    obj.get("content", ""),
                    color=self._get_color(opts.get("color", "WHITE")),
                    font_size=opts.get("font_size", 36)
                )
            
            elif obj_type == "mathtext":
                try:
                    mobj = MathTex(
                        obj.get("content", ""),
                        color=self._get_color(opts.get("color", "WHITE")),
                        font_size=opts.get("font_size", 36)
                    )
                except Exception as e:
                    print(f"[WARN] MathTex failed (LaTeX not installed?), falling back to Text: {e}")
                    mobj = Text(
                        obj.get("content", ""),
                        color=self._get_color(opts.get("color", "WHITE")),
                        font_size=opts.get("font_size", 36)
                    )
            
            elif obj_type == "circle":
                mobj = Circle(
                    radius=obj.get("radius", 1),
                    color=self._get_color(opts.get("color", "BLUE")),
                    fill_opacity=opts.get("fill_opacity", 0)
                )
            
            elif obj_type == "square":
                mobj = Square(
                    side_length=obj.get("side", 1),
                    color=self._get_color(opts.get("color", "YELLOW")),
                    fill_opacity=opts.get("fill_opacity", 0)
                )
            
            elif obj_type == "rectangle":
                mobj = Rectangle(
                    width=obj.get("width", 2),
                    height=obj.get("height", 1),
                    color=self._get_color(opts.get("color", "YELLOW")),
                    fill_opacity=opts.get("fill_opacity", 0)
                )
            
            elif obj_type == "line":
                start = obj.get("start", [0, 0, 0])
                end = obj.get("end", [1, 0, 0])
                mobj = Line(
                    start=start,
                    end=end,
                    color=self._get_color(opts.get("color", "WHITE"))
                )
            
            elif obj_type == "arrow":
                start = obj.get("start", [0, 0, 0])
                end = obj.get("end", [1, 0, 0])
                mobj = Arrow(
                    start=start,
                    end=end,
                    color=self._get_color(opts.get("color", "WHITE")),
                    buff=0
                )
            
            elif obj_type == "dot":
                mobj = Dot(
                    point=obj.get("position", [0, 0, 0]),
                    color=self._get_color(opts.get("color", "WHITE")),
                    radius=opts.get("radius", 0.08)
                )
            
            elif obj_type == "numberplane":
                mobj = NumberPlane(
                    x_range=opts.get("x_range", [-7, 7, 1]),
                    y_range=opts.get("y_range", [-4, 4, 1]),
                    background_line_style={"stroke_opacity": 0.4}
                )
            
            elif obj_type == "axes":
                mobj = Axes(
                    x_range=opts.get("x_range", [-7, 7, 1]),
                    y_range=opts.get("y_range", [-4, 4, 1]),
                    axis_config={"color": self._get_color(opts.get("color", "WHITE"))}
                )
            
            elif obj_type == "group":
                # Groups will be handled in animations
                mobj = VGroup()
            
            else:
                print(f"[WARN] Unknown object type '{obj_type}' — skipping")
                continue
            
            # Apply position if specified and not handled in constructor
            if obj_type not in ["line", "arrow", "dot"] and "position" in obj:
                mobj.move_to(obj["position"])
            
            objects[obj_id] = mobj
        
        # --- Animation section ---
        for anim in spec.get("animations", []):
            try:
                # Handle simultaneous animations
                if isinstance(anim, list):
                    # Multiple animations at once
                    anim_list = []
                    run_time = anim[0].get("run_time", 1) if anim else 1
                    
                    for sub_anim in anim:
                        target_id = sub_anim.get("target")
                        if target_id not in objects:
                            continue
                        
                        anim_obj = self._create_animation(sub_anim, objects)
                        if anim_obj:
                            anim_list.append(anim_obj)
                    
                    if anim_list:
                        self.play(*anim_list, run_time=run_time)
                    continue
                
                target_id = anim.get("target")
                action = anim.get("action", "").lower()
                run_time = anim.get("run_time", 1)
                
                if target_id not in objects:
                    print(f"[WARN] Target '{target_id}' not found")
                    continue
                
                target = objects[target_id]
                
                if action == "write":
                    self.play(Write(target), run_time=run_time)
                
                elif action == "create":
                    self.play(Create(target), run_time=run_time)
                
                elif action == "fadein":
                    self.play(FadeIn(target), run_time=run_time)
                
                elif action == "fadeout":
                    self.play(FadeOut(target), run_time=run_time)
                
                elif action == "rotate":
                    angle_expr = anim.get("angle", "0")
                    angle = self._eval_angle(angle_expr)
                    about_point = anim.get("about_point", ORIGIN)
                    self.play(Rotate(target, angle=angle, about_point=about_point), run_time=run_time)
                
                elif action == "move_to":
                    pos = anim.get("position", [0, 0, 0])
                    self.play(target.animate.move_to(pos), run_time=run_time)
                
                elif action == "shift":
                    direction = anim.get("direction", [0, 0, 0])
                    self.play(target.animate.shift(direction), run_time=run_time)
                
                elif action == "scale":
                    factor = anim.get("factor", 1.0)
                    self.play(target.animate.scale(factor), run_time=run_time)
                
                elif action == "changecolor":
                    color = self._get_color(anim.get("color", "YELLOW"))
                    self.play(target.animate.set_color(color), run_time=run_time)
                
                elif action == "transform":
                    target_obj_id = anim.get("target_object")
                    if target_obj_id in objects:
                        self.play(Transform(target, objects[target_obj_id]), run_time=run_time)
                
                elif action == "indicate":
                    self.play(Indicate(target, scale_factor=anim.get("scale_factor", 1.2)), run_time=run_time)
                
                elif action == "circumscribe":
                    self.play(Circumscribe(target, color=self._get_color(anim.get("color", "YELLOW"))), run_time=run_time)
                
                elif action == "wait":
                    self.wait(anim.get("duration", 1))
                
                elif action == "group":
                    # Add objects to a group
                    members = anim.get("members", [])
                    for member_id in members:
                        if member_id in objects:
                            target.add(objects[member_id])
                
                else:
                    print(f"[WARN] Unknown animation action '{action}'")
            
            except Exception as e:
                print(f"[ERROR] Animation failed: {e}")
                import traceback
                traceback.print_exc()
        
        self.wait(2)
    
    def _create_animation(self, anim, objects):
        """Helper to create animation objects"""
        target_id = anim.get("target")
        action = anim.get("action", "").lower()
        run_time = anim.get("run_time", 1)
        
        if target_id not in objects:
            return None
        
        target = objects[target_id]
        
        if action == "rotate":
            angle_expr = anim.get("angle", "0")
            angle = self._eval_angle(angle_expr)
            about_point = anim.get("about_point", ORIGIN)
            return Rotate(target, angle=angle, about_point=about_point)
        elif action == "move_to":
            pos = anim.get("position", [0, 0, 0])
            return target.animate.move_to(pos)
        elif action == "shift":
            direction = anim.get("direction", [0, 0, 0])
            return target.animate.shift(direction)
        elif action == "scale":
            factor = anim.get("factor", 1.0)
            return target.animate.scale(factor)
        elif action == "changecolor":
            color = self._get_color(anim.get("color", "YELLOW"))
            return target.animate.set_color(color)
        
        return None
    
    def _get_color(self, color_str):
        """Convert color string to Manim color"""
        color_map = {
            "WHITE": WHITE, "BLUE": BLUE, "YELLOW": YELLOW,
            "RED": RED, "GREEN": GREEN, "PINK": PINK,
            "ORANGE": ORANGE, "PURPLE": PURPLE, "GRAY": GRAY,
            "LIGHT_GRAY": LIGHT_GRAY, "DARK_GRAY": DARK_GRAY
        }
        return color_map.get(color_str.upper(), WHITE)
    
    def _eval_angle(self, angle_expr):
        """Safely evaluate angle expressions"""
        if isinstance(angle_expr, (int, float)):
            return angle_expr
        try:
            return eval(str(angle_expr), {"math": math, "PI": PI, "pi": PI, "TAU": TAU})
        except:
            return 0 