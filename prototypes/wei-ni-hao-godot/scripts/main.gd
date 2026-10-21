extends Node2D
## 遊戲流程：標題 → 關卡說明 → 遊玩 → 過關結算 → 下一關 … → 結局。
## 也負責畫面上方的數值列、下方的對話框，和跨關保存的數值。

const LevelScript := preload("res://scripts/level.gd")
const FONT_PATH := "res://assets/fonts/NotoSansTC-Subset.ttf"

const C_PANEL := Color("15131F")
const C_TEXT := Color("F3EBDD")
const C_SUB := Color("B9AFC8")
const C_AMBER := Color("F2A23A")
const C_CORAL := Color("E8645A")

# 跨關保存（原作的「控制」「自我」「好好談過幾次」）
var ctrl := 40
var selfv := 0
var talks := 0
var caught := 0

var levels: Array = []
var level_index := -1
var level = null  # level.gd
var state := "title"  # title / intro / play / result / ending / failed
var last_result := {}

var font: Font
var top_label: Label
var room_label: Label
var hint_label: Label
var msg_box: ColorRect
var msg_label: Label
var msg_time := 0.0
var card: ColorRect
var card_title: Label
var card_body: Label
var card_foot: Label

var shot := {}  # 截圖模式（測試用）


func _ready() -> void:
	_setup_input()
	font = _load_font()
	levels = LevelData.all()
	_build_hud()
	_parse_args()
	if shot.is_empty():
		_show_title()
	else:
		_start_shot()


# ---------- 輸入 ----------
func _setup_input() -> void:
	_add_action("move_left", [KEY_A, KEY_LEFT])
	_add_action("move_right", [KEY_D, KEY_RIGHT])
	_add_action("up", [KEY_W, KEY_UP])
	_add_action("down", [KEY_S, KEY_DOWN])
	_add_action("interact", [KEY_E, KEY_SPACE])
	_add_action("confirm", [KEY_ENTER, KEY_KP_ENTER])
	_add_action("restart", [KEY_R])
	_add_action("level_1", [KEY_1])
	_add_action("level_2", [KEY_2])
	_add_action("level_3", [KEY_3])


func _add_action(action: String, keys: Array) -> void:
	if not InputMap.has_action(action):
		InputMap.add_action(action)
	for k in keys:
		var ev := InputEventKey.new()
		ev.physical_keycode = k
		InputMap.action_add_event(action, ev)


func _unhandled_input(event: InputEvent) -> void:
	if not event.is_pressed() or event.is_echo():
		return
	for i in 3:
		if event.is_action("level_%d" % (i + 1)):
			if state == "title":
				_new_game()
			_show_intro(i)
			return
	if event.is_action("confirm") or (event.is_action("interact") and state != "play"):
		_advance()
	elif event.is_action("restart") and state == "play":
		_restart_level()


func _advance() -> void:
	match state:
		"title":
			_new_game()
			_show_intro(0)
		"intro":
			_hide_card()
			level.frozen = false
			state = "play"
		"result":
			if level_index < levels.size() - 1:
				_show_intro(level_index + 1)
			else:
				_show_title()
		"ending":
			_show_title()


# ---------- 流程 ----------
func _new_game() -> void:
	ctrl = 40
	selfv = 0
	talks = 0
	caught = 0


func _load_level(i: int) -> void:
	if level:
		level.queue_free()
	level_index = i
	level = LevelScript.new()
	add_child(level)
	level.setup(levels[i], self, font)
	level.message.connect(_on_message)
	level.cleared.connect(_on_cleared)
	level.failed.connect(_on_failed)
	_hide_message()


func _show_title() -> void:
	state = "title"
	if level:
		level.queue_free()
		level = null
	_show_card("為你好　FOR YOUR OWN GOOD",
		"2D 探索型關卡原型\n\n你是一個想畫畫的孩子。從 7 歲長到 30 歲，家越來越大，看著你的眼睛也越來越多。\n\n←　→　走路\n↑　↓　上下樓梯／在家具旁按 ↓ 躲起來\nE　互動（假裝讀書、好好談、上桌）\nR　重來這一關　　1 / 2 / 3　直接跳關",
		"按 Enter 開始")


func _show_intro(i: int) -> void:
	_load_level(i)
	state = "intro"
	var d: Dictionary = levels[i]
	_show_card(d.title,
		"媽媽：「%s」\n\n目標：%s\n\n提示：%s" % [d.say, d.goal, d.tip],
		"按 Enter 開始這一關")


func _restart_level() -> void:
	_load_level(level_index)
	level.frozen = false
	state = "play"
	_on_message("（重來這一關。控制、自我、好好談的次數會保留。）", "info")


func _on_cleared(result: Dictionary) -> void:
	last_result = result
	if result.has("ending"):
		_show_ending(result.ending)
		return
	state = "result"
	var d: Dictionary = levels[level_index]
	_show_card(d.title + "　過關",
		"%s\n\n控制 %d　｜　自我 %d　｜　被抓包 %d 次" % [d.clear_text, ctrl, selfv, caught],
		"按 Enter 進下一關" if level_index < levels.size() - 1 else "按 Enter 回標題")


func _on_failed(text: String) -> void:
	state = "failed"
	_on_message(text + "（2 秒後重來這一關）", "mom")
	get_tree().create_timer(2.0).timeout.connect(func():
		if state == "failed":
			_restart_level())


func _show_ending(kind: String) -> void:
	state = "ending"
	var stats := "控制 %d　｜　自我 %d　｜　好好談 %d 次　｜　被抓包 %d 次" % [ctrl, selfv, talks, caught]
	if kind == "truth":
		_show_card("結局：說出真心話",
			"你把素描本放在餐桌上。她摸著封面摸了很久。\n「你外婆說畫畫沒出息，當著我的面撕了一半。」\n停了一下。「我只是……不想你跟我一樣後悔。我好像用錯方法了。」\n\n多年以後，你的孩子在牆上畫畫。\n「這是什麼？可以講給我聽嗎？」\n孩子講了二十分鐘。你一句建議都沒有給。\n\n" + stats,
			"按 Enter 回標題")
	else:
		_show_card("結局：我很好",
			"你坐下說「我很好」。媽媽又幫你夾了一次菜。\n那本素描本，你後來再也沒有提起。\n\n多年以後，你的孩子在牆上畫畫。\n「我是為你好，先去寫功課。」\n原來那四個字，是會遺傳的。\n\n" + stats,
			"按 Enter 回標題")


# ---------- 畫面上的介面 ----------
func _process(delta: float) -> void:
	if msg_time > 0.0:
		msg_time -= delta
		if msg_time <= 0.0:
			_hide_message()
	if level == null or state == "title":
		top_label.text = ""
		room_label.text = ""
		return
	var d: Dictionary = levels[level_index]
	var parts := PackedStringArray([d.title, "控制 %d" % ctrl, "自我 %d" % selfv, "好好談 %d" % talks])
	if d.has("desk"):
		parts.append("巡房倒數 %d 秒" % ceili(level.patrol_timer) if level.decoy else "監視器：在看你")
	if d.has("energy"):
		parts.append("電量 %d" % level.energy)
	top_label.text = "　｜　".join(parts)
	var r: Dictionary = level.cur_room
	room_label.text = "" if r.is_empty() else ("位置：" + r.name + ("（優勢點）" if level.in_poa else ""))


func _build_hud() -> void:
	var hud := CanvasLayer.new()
	add_child(hud)
	var bar := ColorRect.new()
	bar.color = Color(C_PANEL, 0.92)
	bar.position = Vector2.ZERO
	bar.size = Vector2(1280, 44)
	hud.add_child(bar)
	top_label = _make_label(18, C_TEXT)
	top_label.position = Vector2(20, 9)
	top_label.size = Vector2(900, 30)
	hud.add_child(top_label)
	room_label = _make_label(18, C_AMBER)
	room_label.position = Vector2(880, 9)
	room_label.size = Vector2(380, 30)
	room_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_RIGHT
	hud.add_child(room_label)

	hint_label = _make_label(15, C_SUB)
	hint_label.position = Vector2(20, 690)
	hint_label.size = Vector2(1240, 24)
	hint_label.text = "←→ 走　↑↓ 樓梯／躲　E 互動　R 重來　1/2/3 跳關"
	hud.add_child(hint_label)

	msg_box = ColorRect.new()
	msg_box.color = Color(C_PANEL, 0.94)
	msg_box.position = Vector2(140, 596)
	msg_box.size = Vector2(1000, 84)
	msg_box.visible = false
	hud.add_child(msg_box)
	msg_label = _make_label(19, C_TEXT)
	msg_label.position = Vector2(20, 10)
	msg_label.size = Vector2(960, 64)
	msg_label.autowrap_mode = TextServer.AUTOWRAP_ARBITRARY
	msg_label.vertical_alignment = VERTICAL_ALIGNMENT_CENTER
	msg_box.add_child(msg_label)

	card = ColorRect.new()
	card.color = C_PANEL
	card.position = Vector2.ZERO
	card.size = Vector2(1280, 720)
	hud.add_child(card)
	card_title = _make_label(40, C_AMBER)
	card_title.position = Vector2(160, 90)
	card_title.size = Vector2(960, 60)
	card.add_child(card_title)
	card_body = _make_label(22, C_TEXT)
	card_body.position = Vector2(160, 170)
	card_body.size = Vector2(960, 440)
	card_body.autowrap_mode = TextServer.AUTOWRAP_ARBITRARY
	card.add_child(card_body)
	card_foot = _make_label(20, C_SUB)
	card_foot.position = Vector2(160, 630)
	card_foot.size = Vector2(960, 30)
	card.add_child(card_foot)


func _make_label(size: int, color: Color) -> Label:
	var l := Label.new()
	l.add_theme_font_override("font", font)
	l.add_theme_font_size_override("font_size", size)
	l.add_theme_color_override("font_color", color)
	return l


func _show_card(title: String, body: String, foot: String) -> void:
	card.visible = true
	card_title.text = title
	card_body.text = body
	card_foot.text = foot
	_hide_message()


func _hide_card() -> void:
	card.visible = false


func _on_message(text: String, kind: String) -> void:
	msg_box.visible = true
	msg_label.text = text
	msg_label.add_theme_color_override("font_color", C_CORAL if kind == "mom" else C_TEXT)
	msg_time = 4.5


func _hide_message() -> void:
	if msg_box:
		msg_box.visible = false
	msg_time = 0.0


func _load_font() -> Font:
	if ResourceLoader.exists(FONT_PATH):
		var f = load(FONT_PATH)
		if f is Font:
			return f
	if FileAccess.file_exists(FONT_PATH):
		var ff := FontFile.new()
		ff.data = FileAccess.get_file_as_bytes(FONT_PATH)
		return ff
	return ThemeDB.fallback_font


# ---------- 截圖模式（給自動測試用，玩家用不到） ----------
# 例：godot --path . -- --shot=2 --x=540 --floor=394 --reveal --frames=40 --out=/tmp/a.png
func _parse_args() -> void:
	for a in OS.get_cmdline_user_args():
		if a.begins_with("--") and "=" in a:
			var kv := a.substr(2).split("=", true, 1)
			shot[kv[0]] = kv[1]
		elif a.begins_with("--"):
			shot[a.substr(2)] = "1"


func _start_shot() -> void:
	_new_game()
	var card_mode: String = shot.get("card", "")
	if card_mode == "title":
		_show_title()
	else:
		var i := int(shot.get("shot", "1")) - 1
		_show_intro(i)
		if card_mode != "intro":
			_advance()
			if shot.has("x"):
				level.px = float(shot.x)
			if shot.has("floor"):
				level.floor_y = int(shot.floor)
				level.py = float(shot.floor)
			if shot.has("reveal"):
				for r in level.rooms:
					r.revealed = true
			if shot.has("msg"):
				_on_message(shot.msg, "mom")
	var frames := int(shot.get("frames", "40"))
	for n in frames:
		await get_tree().process_frame
	var img := get_viewport().get_texture().get_image()
	img.save_png(shot.get("out", "user://shot.png"))
	get_tree().quit()
