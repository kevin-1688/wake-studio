extends Node2D
## 一關：家的剖面地圖、玩家、媽媽的視線和互動。
## 玩家只會沿著地板左右走；遇到樓梯按 ↑／↓ 換層；在家具旁按 ↓ 躲起來。

signal message(text: String, kind: String)  # kind："mom" 媽媽／親戚說的話，"info" 旁白
signal cleared(result: Dictionary)
signal failed(text: String)

const MAP_SIZE := Vector2(1184, 592)
const SPEED := 170.0
const STAIR_REACH := 22.0
const ZOOM_NEAR := Vector2(1.7, 1.7)
const ZOOM_FAR := Vector2(1.0, 1.0)

const C_BG := Color("15131F")
const C_GRID := Color("221E31")
const C_TEXT := Color("F3EBDD")
const C_SUB := Color("B9AFC8")
const C_AMBER := Color("F2A23A")
const C_TEAL := Color("4FC1B6")
const C_CORAL := Color("E8645A")
const C_WOOD := Color("8A5A2B")
const C_FLOOR := Color("3A3350")

var data: Dictionary
var game  # main.gd（存跨關的控制、自我、好好談）
var font: Font

var rooms: Array = []
var spans := {}  # 地板高度(int) -> Array[Vector2]，每段 x 從 a 走到 b
var stairs: Array = []
var hides: Array = []
var pickups: Array = []
var zones: Array = []
var npcs: Array = []

# 玩家
var px := 0.0
var py := 0.0  # 畫面上的腳底高度（爬樓梯時會在兩層之間）
var floor_y := 0
var facing := 1
var is_hiding := false
var climbing := false
var invuln := 0.0
var flash := 0.0
var walk_phase := 0.0
var frozen := true
var cur_room: Dictionary = {}
var in_poa := false
var poa_seen := false

# 這一關的狀態
var t := 0.0
var energy := 100
var decoy := false
var patrol_timer := 0.0
var has := {}
var confirm_until := -1.0

var camera: Camera2D


func setup(d: Dictionary, g, f: Font) -> void:
	data = d
	game = g
	font = f
	for r in d.rooms:
		var room: Dictionary = r.duplicate(true)
		room.revealed = false
		if not room.has("floors"):
			room.floors = [int(room.rect.end.y)]
		rooms.append(room)
		for fy in room.floors:
			_add_span(int(fy), room.rect.position.x, room.rect.end.x)
	for c in d.corridors:
		_add_span(int(c[2]), float(c[0]), float(c[1]))
	for k in spans.keys():
		spans[k] = _merge(spans[k])
	stairs = d.stairs.duplicate(true)
	hides = d.hides.duplicate(true)
	for p in d.pickups:
		var pk: Dictionary = p.duplicate(true)
		pk.taken = false
		pickups.append(pk)
	for z in d.zones:
		var zone: Dictionary = z.duplicate(true)
		if zone.type == "patrol":
			zone.mx = float(zone.x1)
			zone.mdir = -1
			zone.wait = 0.0
		zones.append(zone)
	for n in d.npcs:
		var npc: Dictionary = n.duplicate(true)
		npc.satisfied = false
		npcs.append(npc)
	energy = int(d.get("energy", 100))
	_place_at_start()
	camera = Camera2D.new()
	add_child(camera)
	camera.zoom = ZOOM_NEAR
	camera.position = Vector2(px, py - 50)
	if is_inside_tree():
		camera.make_current()
	_update_room()
	camera.zoom = ZOOM_FAR if in_poa else ZOOM_NEAR
	camera.position = _camera_target()


# ---------- 地板 ----------
func _add_span(fy: int, a: float, b: float) -> void:
	if not spans.has(fy):
		spans[fy] = []
	spans[fy].append(Vector2(a, b))


func _merge(list: Array) -> Array:
	list.sort_custom(func(u, v): return u.x < v.x)
	var out: Array = []
	for s in list:
		if out.size() > 0 and s.x <= out[-1].y + 1.0:
			var last: Vector2 = out[-1]
			last.y = maxf(last.y, s.y)
			out[-1] = last
		else:
			out.append(s)
	return out


func span_for(x: float, fy: int) -> Vector2:
	for s in spans.get(fy, []):
		if x >= s.x - 1.0 and x <= s.y + 1.0:
			return s
	return Vector2(x, x)


func _place_at_start() -> void:
	px = data.start.x
	floor_y = int(data.start.y)
	py = floor_y
	is_hiding = false
	climbing = false


# ---------- 主迴圈 ----------
func _physics_process(delta: float) -> void:
	t += delta
	_update_zones(delta)
	if invuln > 0.0:
		invuln -= delta
	if flash > 0.0:
		flash -= delta
	if not frozen and not climbing:
		_handle_input(delta)
		_update_room()
		_check_detection()
		_update_rules(delta)
	_update_camera(delta)
	queue_redraw()


func _handle_input(delta: float) -> void:
	var dir := Input.get_axis("move_left", "move_right")
	if is_hiding:
		if absf(dir) > 0.5 or Input.is_action_just_pressed("up") or Input.is_action_just_pressed("down") or Input.is_action_just_pressed("interact"):
			is_hiding = false
		return
	if Input.is_action_just_pressed("up"):
		var s: Dictionary = _stair_near(true)
		if not s.is_empty():
			_climb(s, true)
			return
	if Input.is_action_just_pressed("down"):
		var s2: Dictionary = _stair_near(false)
		if not s2.is_empty():
			_climb(s2, false)
			return
		var h: Dictionary = _hide_near()
		if not h.is_empty():
			is_hiding = true
			px = h.x
			return
	if Input.is_action_just_pressed("interact"):
		_interact()
		return
	if absf(dir) > 0.1:
		facing = 1 if dir > 0.0 else -1
		var sp := span_for(px, floor_y)
		px = clampf(px + dir * SPEED * delta, sp.x + 10.0, sp.y - 10.0)
		walk_phase += delta * 12.0
	_check_pickups()


func _stair_near(up: bool) -> Dictionary:
	for s in stairs:
		if absf(s.x - px) > STAIR_REACH:
			continue
		var one_way: String = s.get("one_way", "")
		if up and floor_y == int(s.bottom) and one_way != "down":
			return s
		if not up and floor_y == int(s.top) and one_way != "up":
			return s
	return {}


func _hide_near() -> Dictionary:
	for h in hides:
		if int(h.floor) == floor_y and absf(h.x - px) < h.w * 0.5 + 8.0:
			return h
	return {}


func _climb(s: Dictionary, up: bool) -> void:
	climbing = true
	px = s.x
	var target := int(s.top) if up else int(s.bottom)
	var tw := create_tween()
	tw.tween_property(self, "py", float(target), 0.45)
	tw.finished.connect(func():
		floor_y = target
		py = target
		climbing = false)


# ---------- 房間、優勢點、鏡頭 ----------
func room_at(x: float, fy: float) -> Dictionary:
	for r in rooms:
		if r.rect.has_point(Vector2(x, fy - 2.0)):
			return r
	return {}


func _update_room() -> void:
	var r := room_at(px, floor_y)
	if r.is_empty():
		in_poa = false
		return
	if r.id != cur_room.get("id", ""):
		cur_room = r
		r.revealed = true
	in_poa = r.get("poa", false)
	if in_poa and not poa_seen:
		poa_seen = true
		for rr in rooms:
			rr.revealed = true
		message.emit("（優勢點：站在這裡，整個家一覽無遺。媽媽的視線、每條路都看得到。）", "info")


func _camera_target() -> Vector2:
	if in_poa:
		return Vector2(MAP_SIZE.x * 0.5, MAP_SIZE.y * 0.5 + 8.0)
	return Vector2(px, py - 50.0)


func _update_camera(delta: float) -> void:
	var k := 1.0 - exp(-delta * 4.0)
	camera.zoom = camera.zoom.lerp(ZOOM_FAR if in_poa else ZOOM_NEAR, k)
	camera.position = camera.position.lerp(_camera_target(), k)


func is_revealed_at(x: float, fy: float) -> bool:
	var r := room_at(x, fy)
	return r.is_empty() or r.revealed


# ---------- 視線 ----------
func _cycle_state(z: Dictionary) -> String:
	var period: float = z.on + z.off
	if z.off <= 0.0:
		return "on"
	var c := fmod(t + z.phase, period)
	if c < z.on:
		return "on"
	if c >= period - z.warn:
		return "warn"
	return "off"


func zone_range(z: Dictionary) -> Vector2:
	if z.type == "patrol":
		# 視線只照到客廳和門口，不會穿牆照進別的房間
		var reach: float = z.base + game.ctrl * z.per
		var lo: float = z.x0 - 60.0
		var hi: float = z.x1 + 60.0
		if z.mdir > 0:
			return Vector2(z.mx, minf(z.mx + reach, hi))
		return Vector2(maxf(z.mx - reach, lo), z.mx)
	if z.has("origin"):
		var length: float = z.base + game.ctrl * z.per
		var far: float = z.origin + z.dir * length
		return Vector2(minf(far, z.origin), maxf(far, z.origin))
	return Vector2(z.x0, z.x1)


func zone_active(z: Dictionary) -> bool:
	if z.type == "patrol":
		return true
	return _cycle_state(z) == "on"


func _update_zones(delta: float) -> void:
	if frozen:
		return
	for z in zones:
		if z.type != "patrol":
			continue
		if z.wait > 0.0:
			z.wait -= delta
			continue
		z.mx += z.mdir * z.speed * delta
		if z.mx <= z.x0 or z.mx >= z.x1:
			z.mx = clampf(z.mx, z.x0, z.x1)
			z.mdir *= -1
			z.wait = z.pause


func npc_looking(n: Dictionary) -> bool:
	return fmod(t + n.phase, n.look + n.busy) < n.look


func _check_detection() -> void:
	if is_hiding or climbing or invuln > 0.0:
		return
	for z in zones:
		if int(z.floor) != floor_y:
			continue
		if z.type == "patrol" and absf(px - z.mx) < 16.0:
			_caught(z.line)
			return
		if not zone_active(z):
			continue
		var r := zone_range(z)
		if px >= r.x and px <= r.y:
			_caught(z.line)
			return
	for n in npcs:
		if n.type != "relative" or n.satisfied or int(n.floor) != floor_y:
			continue
		if px >= n.x0 and px <= n.x1 and npc_looking(n):
			_questioned(n)
			return


func _caught(line: String) -> void:
	game.ctrl = clampi(game.ctrl + int(data.get("caught_ctrl", 10)), 0, 100)
	game.caught += 1
	message.emit(line + "　（被抓包：控制 +%d，視線變更長）" % int(data.get("caught_ctrl", 10)), "mom")
	decoy = false
	_place_at_start()
	_update_room()
	invuln = 1.5
	flash = 0.6


func _questioned(n: Dictionary) -> void:
	energy -= 25
	game.caught += 1
	message.emit(n.line_caught + "　（電量 −25）", "mom")
	px = n.x0 - 18.0 if px < n.x else n.x1 + 18.0
	invuln = 1.0
	flash = 0.4
	if energy <= 0:
		_burnout()


func _burnout() -> void:
	frozen = true
	failed.emit("電量歸零。你說頭有點痛，先回房間躺著了。")


# ---------- 互動 ----------
func _check_pickups() -> void:
	for p in pickups:
		if p.taken or int(p.floor) != floor_y or absf(p.x - px) > 18.0:
			continue
		p.taken = true
		has[p.id] = true
		game.selfv += int(p.get("self", 0))
		message.emit(p.msg, "info")
		if p.get("clear", false):
			_clear({})


func _interact() -> void:
	if data.has("desk") and floor_y == int(data.desk.floor) and absf(px - data.desk.x) < 40.0:
		_use_desk()
		return
	for n in npcs:
		if int(n.floor) != floor_y or absf(n.x - px) > 80.0:
			continue
		if n.type == "relative":
			_talk(n)
			return
		if n.type == "boss":
			_boss()
			return


func _use_desk() -> void:
	if has.get("painting", false):
		_clear({})
	elif not decoy:
		decoy = true
		patrol_timer = data.timer
		message.emit("（你把課本立起來，檯燈開著。監視器拍到的，是一個在讀書的你。）媽媽巡房倒數開始。", "info")
	else:
		message.emit("畫還沒拿到。巷口畫室在後門的樓下。", "info")


func _talk(n: Dictionary) -> void:
	if n.satisfied:
		message.emit("（%s在滑手機，沒空理你。）" % n.label, "info")
		return
	if energy < 15:
		message.emit("太累了，講不動。", "info")
		return
	energy -= 15
	game.talks += 1
	game.ctrl = clampi(game.ctrl - 5, 0, 100)
	n.satisfied = true
	message.emit(n.line_talk, "info")


func _boss() -> void:
	if not has.get("sketch", false):
		if t < confirm_until:
			_clear({"ending": "fine"})
		else:
			confirm_until = t + 3.0
			message.emit(data.confirm_line, "info")
		return
	if game.talks < 2:
		message.emit(data.need_line % game.talks, "info")
		return
	_clear({"ending": "truth"})


func _update_rules(delta: float) -> void:
	if not data.has("desk") or invuln > 0.0:
		return
	if decoy:
		patrol_timer -= delta
		if patrol_timer <= 0.0:
			_caught(data.timer_line)
	elif cur_room.get("id", "") != "a" or room_at(px, floor_y).is_empty():
		_caught(data.camera_line)


func _clear(result: Dictionary) -> void:
	frozen = true
	result.level = data.id
	cleared.emit(result)


# ---------- 提示 ----------
func prompt_text() -> String:
	if is_hiding:
		return "躲好了（方向鍵出來）"
	if climbing or frozen:
		return ""
	var parts := PackedStringArray()
	if not _stair_near(true).is_empty():
		parts.append("↑ 上樓")
	if not _stair_near(false).is_empty():
		parts.append("↓ 下樓")
	elif not _hide_near().is_empty():
		parts.append("↓ 躲")
	if data.has("desk") and floor_y == int(data.desk.floor) and absf(px - data.desk.x) < 40.0:
		parts.append("E 回書桌" if decoy else "E 假裝讀書")
	for n in npcs:
		if int(n.floor) == floor_y and absf(n.x - px) <= 80.0:
			if n.type == "relative" and not n.satisfied:
				parts.append("E 好好談")
			elif n.type == "boss":
				parts.append("E 上桌")
	return "　".join(parts)


# ---------- 畫面 ----------
func _draw() -> void:
	draw_rect(Rect2(-600, -400, MAP_SIZE.x + 1200, MAP_SIZE.y + 800), C_BG)
	for x in range(0, int(MAP_SIZE.x) + 1, 48):
		draw_line(Vector2(x, 0), Vector2(x, MAP_SIZE.y), C_GRID, 2.0)
	draw_rect(Rect2(Vector2.ZERO, MAP_SIZE), Color("2A2540"), false, 3.0)
	for c in data.corridors:
		_draw_corridor(c)
	for r in rooms:
		_draw_room(r)
	for s in stairs:
		_draw_stair(s)
	for z in zones:
		_draw_zone(z)
	for h in hides:
		if is_revealed_at(h.x, h.floor):
			_draw_hide(h)
	if data.has("desk"):
		_draw_desk()
	for p in pickups:
		if not p.taken and is_revealed_at(p.x, p.floor):
			_draw_pickup(p)
	for n in npcs:
		if is_revealed_at(n.x, n.floor):
			_draw_npc(n)
	_draw_player()


func _draw_corridor(c: Array) -> void:
	var fy := float(c[2])
	draw_rect(Rect2(c[0], fy - 54.0, c[1] - c[0], 54.0), Color("1E1B2B"))
	draw_rect(Rect2(c[0], fy - 6.0, c[1] - c[0], 6.0), C_FLOOR)


func _dashed_rect(rect: Rect2, color: Color, width: float) -> void:
	var p := rect.position
	var e := rect.end
	draw_dashed_line(p, Vector2(e.x, p.y), color, width, 10.0)
	draw_dashed_line(Vector2(e.x, p.y), e, color, width, 10.0)
	draw_dashed_line(e, Vector2(p.x, e.y), color, width, 10.0)
	draw_dashed_line(Vector2(p.x, e.y), p, color, width, 10.0)


func _draw_room(r: Dictionary) -> void:
	var rect: Rect2 = r.rect
	if not r.revealed:
		draw_rect(rect, Color("0F0D17"))
		_dashed_rect(rect, Color("3A3350"), 3.0)
		draw_string(font, rect.position + Vector2(12, 28), "？", HORIZONTAL_ALIGNMENT_LEFT, -1, 20, Color("5B5470"))
		return
	var fill := Color("2A2540")
	var border := C_AMBER
	match r.kind:
		"opt":
			fill = Color("1E2B33")
			border = C_TEAL
		"danger", "boss":
			fill = Color("35202A")
			border = C_CORAL
	draw_rect(rect, fill)
	for fy in r.floors:
		draw_rect(Rect2(rect.position.x, fy - 6.0, rect.size.x, 6.0), C_FLOOR)
	if r.kind == "opt":
		_dashed_rect(rect, border, 4.0)
	else:
		draw_rect(rect, border, false, 4.0)
	draw_string(font, rect.position + Vector2(10, 24), r.name, HORIZONTAL_ALIGNMENT_LEFT, rect.size.x - 20.0, 17, C_TEXT)
	draw_string(font, rect.position + Vector2(10, 44), r.sub, HORIZONTAL_ALIGNMENT_LEFT, rect.size.x - 20.0, 13, C_SUB)


func _draw_stair(s: Dictionary) -> void:
	var top := float(s.top) - 4.0
	var bottom := float(s.bottom)
	var x := float(s.x)
	draw_line(Vector2(x - 9, top), Vector2(x - 9, bottom), C_WOOD, 3.0)
	draw_line(Vector2(x + 9, top), Vector2(x + 9, bottom), C_WOOD, 3.0)
	var y := top + 8.0
	while y < bottom:
		draw_line(Vector2(x - 9, y), Vector2(x + 9, y), C_WOOD, 2.0)
		y += 14.0
	if s.get("one_way", "") == "down":
		draw_string(font, Vector2(x + 14, top + 34), "單向↓", HORIZONTAL_ALIGNMENT_LEFT, -1, 13, C_TEAL)


func _draw_zone(z: Dictionary) -> void:
	var fy := float(z.floor)
	if z.type == "patrol":
		if not is_revealed_at(z.mx, fy):
			return
		var r := zone_range(z)
		var far := r.y if z.mdir > 0 else r.x
		draw_colored_polygon(PackedVector2Array([
			Vector2(z.mx, fy - 40), Vector2(far, fy - 70), Vector2(far, fy - 6), Vector2(z.mx, fy - 20)]),
			Color(C_CORAL, 0.28))
		_draw_person(z.mx, fy, C_CORAL, Color("3B2A20"), int(z.mdir), 1.0, "媽媽")
		return
	var rr := zone_range(z)
	if not is_revealed_at((rr.x + rr.y) * 0.5, fy):
		return
	var state := _cycle_state(z)
	var alpha := 0.0
	if state == "on":
		alpha = 0.32
	elif state == "warn":
		alpha = 0.10 + 0.08 * sin(t * 18.0)
	if alpha <= 0.0:
		return
	if z.has("origin"):
		var far2: float = z.origin + z.dir * (rr.y - rr.x)
		draw_colored_polygon(PackedVector2Array([
			Vector2(z.origin, fy - 70), Vector2(far2, fy - 90), Vector2(far2, fy - 6), Vector2(z.origin, fy - 6)]),
			Color(C_CORAL, alpha))
		draw_rect(Rect2(z.origin - 3, fy - 80, 6, 74), Color(C_CORAL, minf(1.0, alpha * 3.0)))
	else:
		draw_rect(Rect2(rr.x, fy - 104, rr.y - rr.x, 98), Color(C_CORAL, alpha * 0.7))


func _draw_hide(h: Dictionary) -> void:
	var fy := float(h.floor)
	var w := float(h.w)
	draw_rect(Rect2(h.x - w * 0.5, fy - 34, w, 28), Color("5B4636"))
	draw_rect(Rect2(h.x - w * 0.5, fy - 34, w, 6), Color("7A5F48"))
	draw_string(font, Vector2(h.x - w * 0.5, fy - 40), h.label, HORIZONTAL_ALIGNMENT_CENTER, w, 12, C_SUB)


func _draw_desk() -> void:
	var x := float(data.desk.x)
	var fy := float(data.desk.floor)
	draw_rect(Rect2(x - 34, fy - 34, 68, 6), C_WOOD)
	draw_rect(Rect2(x - 30, fy - 28, 5, 22), C_WOOD)
	draw_rect(Rect2(x + 25, fy - 28, 5, 22), C_WOOD)
	draw_rect(Rect2(x + 18, fy - 56, 3, 22), Color("8C82A3"))
	draw_rect(Rect2(x + 10, fy - 60, 18, 6), C_AMBER)
	if decoy:
		draw_rect(Rect2(x - 14, fy - 58, 16, 24), C_TEAL)
		draw_string(font, Vector2(x - 40, fy - 66), "讀書中", HORIZONTAL_ALIGNMENT_CENTER, 80, 13, C_TEAL)
	else:
		draw_rect(Rect2(x - 20, fy - 40, 26, 6), C_TEAL)
	# 天花板上的監視器
	draw_rect(Rect2(x + 60, 70, 18, 10), Color("8C82A3"))
	var blink := 1.0 if fmod(t, 1.0) < 0.6 else 0.3
	draw_rect(Rect2(x + 70, 72, 5, 5), Color(C_CORAL, blink))


func _draw_pickup(p: Dictionary) -> void:
	var fy := float(p.floor)
	var bob := sin(t * 3.0 + p.x) * 3.0
	var col := C_AMBER if p.get("clear", false) or p.id in ["painting", "sketch"] else C_TEAL
	draw_rect(Rect2(p.x - 8, fy - 30 + bob, 16, 16), col)
	draw_rect(Rect2(p.x - 8, fy - 30 + bob, 16, 16), C_TEXT, false, 2.0)
	draw_string(font, Vector2(p.x - 40, fy - 38 + bob), p.label, HORIZONTAL_ALIGNMENT_CENTER, 80, 13, C_TEXT)


func _draw_npc(n: Dictionary) -> void:
	var fy := float(n.floor)
	match n.type:
		"mom":
			_draw_person(n.x, fy, C_CORAL, Color("3B2A20"), -1, 1.0, "媽媽")
		"watcher":
			var looking := false
			for z in zones:
				if int(z.floor) == int(n.floor) and z.type == "cycle":
					looking = _cycle_state(z) == "on"
			draw_rect(Rect2(n.x - 18, fy - 92, 36, 40), Color("1D1A2B"))
			draw_rect(Rect2(n.x - 18, fy - 92, 36, 40), Color("8C82A3"), false, 2.0)
			if looking:
				draw_rect(Rect2(n.x - 7, fy - 84, 14, 14), Color("F3D2B0"))
				draw_rect(Rect2(n.x - 9, fy - 70, 18, 14), Color("8C82A3"))
			draw_string(font, Vector2(n.x - 40, fy - 98), n.label, HORIZONTAL_ALIGNMENT_CENTER, 80, 12, C_SUB)
		"relative":
			if not n.satisfied:
				var look := npc_looking(n)
				draw_rect(Rect2(n.x0, fy - 8, n.x1 - n.x0, 4), Color(C_CORAL, 0.6 if look else 0.2))
				if look:
					draw_string(font, Vector2(n.x - 30, fy - 64), "！", HORIZONTAL_ALIGNMENT_CENTER, 60, 20, C_CORAL)
				else:
					draw_string(font, Vector2(n.x - 30, fy - 64), "（滑手機）", HORIZONTAL_ALIGNMENT_CENTER, 60, 11, C_SUB)
			_draw_person(n.x, fy, Color("8C82A3"), Color("2A2540"), -1, 1.0, n.label)
		"boss":
			draw_rect(Rect2(n.x - 120, fy - 30, 240, 10), Color("A0522D"))
			draw_rect(Rect2(n.x - 110, fy - 20, 8, 14), Color("A0522D"))
			draw_rect(Rect2(n.x + 102, fy - 20, 8, 14), Color("A0522D"))
			draw_circle(Vector2(n.x - 40, fy - 36), 8.0, Color("D9480F"))
			draw_circle(Vector2(n.x + 30, fy - 36), 7.0, Color("F2A23A"))
			_draw_person(n.x + 80, fy, C_CORAL, Color("5B5470"), -1, 1.0, n.label)


func _draw_person(x: float, fy: float, body: Color, hair: Color, dir: int, s: float, label: String) -> void:
	var w := 18.0 * s
	draw_rect(Rect2(x - w * 0.5, fy - 12 * s, 6 * s, 12 * s), Color("2A2540"))
	draw_rect(Rect2(x + w * 0.5 - 6 * s, fy - 12 * s, 6 * s, 12 * s), Color("2A2540"))
	draw_rect(Rect2(x - w * 0.5, fy - 34 * s, w, 22 * s), body)
	draw_rect(Rect2(x - 7 * s, fy - 48 * s, 14 * s, 14 * s), Color("F3D2B0"))
	draw_rect(Rect2(x - 8 * s, fy - 50 * s, 16 * s, 5 * s), hair)
	draw_rect(Rect2(x + dir * 3 * s - 1, fy - 44 * s, 2, 2), Color("15131F"))
	if label != "":
		draw_string(font, Vector2(x - 40, fy - 54 * s), label, HORIZONTAL_ALIGNMENT_CENTER, 80, 12, C_SUB)


func _draw_player() -> void:
	var s: float = data.get("player_scale", 1.0)
	var bob := 0.0
	if not is_hiding and not climbing:
		bob = absf(sin(walk_phase)) * 2.0
	var a := 1.0
	if invuln > 0.0:
		a = 0.4 + 0.6 * float(int(t * 12.0) % 2)
	if is_hiding:
		a = 0.35
	var body := Color(C_TEAL, a)
	var w := 16.0 * s
	var base := py - bob
	draw_rect(Rect2(px - w * 0.5, base - 12 * s, 5 * s, 12 * s), Color(Color("3B2A20"), a))
	draw_rect(Rect2(px + w * 0.5 - 5 * s, base - 12 * s, 5 * s, 12 * s), Color(Color("3B2A20"), a))
	draw_rect(Rect2(px - w * 0.5, base - 32 * s, w, 20 * s), body)
	draw_rect(Rect2(px - 7 * s, base - 46 * s, 14 * s, 14 * s), Color(Color("F3D2B0"), a))
	draw_rect(Rect2(px - 8 * s, base - 49 * s, 16 * s, 6 * s), Color(Color("3B2A20"), a))
	draw_rect(Rect2(px + facing * 3 * s - 1, base - 42 * s, 2, 2), Color(Color("15131F"), a))
	if game.selfv > 0 and not is_hiding:
		var cx := px + w * 0.5 if facing > 0 else px - w * 0.5 - 10 * s
		draw_rect(Rect2(cx, base - 24 * s, 10 * s, 3), Color(C_AMBER, a))
	var hint := prompt_text()
	if hint != "":
		var hw := font.get_string_size(hint, HORIZONTAL_ALIGNMENT_LEFT, -1, 12).x
		var hy := base - 58.0 * s
		draw_rect(Rect2(px - hw * 0.5 - 6.0, hy - 14.0, hw + 12.0, 19.0), Color(C_BG, 0.9))
		draw_string(font, Vector2(px - hw * 0.5, hy), hint, HORIZONTAL_ALIGNMENT_LEFT, -1, 12, C_AMBER)
	if flash > 0.0:
		draw_rect(Rect2(-600, -400, MAP_SIZE.x + 1200, MAP_SIZE.y + 800), Color(C_CORAL, flash * 0.35))
