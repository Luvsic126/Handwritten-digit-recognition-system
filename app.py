import os
import tkinter as tk
from tkinter import messagebox, filedialog

from PIL import Image, ImageDraw, ImageTk

from predict import load_model, predict
from visualize import plot_training_curves, plot_confusion_matrix

CANVAS_SIZE = 280
BRUSH_RADIUS = 10
MODEL_PATH = os.path.join(os.path.dirname(__file__), "models", "mnist_cnn.pth")


class DigitRecognizerApp:
    def __init__(self, root):
        self.root = root
        self.root.title("手写数字识别系统")
        self.root.resizable(False, False)

        try:
            self.model, self.device = load_model()
            model_loaded = True
        except Exception:
            self.model = None
            self.device = None
            model_loaded = False

        # ---- 顶部标题 ----
        title = tk.Label(root, text="手写数字识别系统", font=("微软雅黑", 20, "bold"))
        title.pack(pady=8)

        # ---- 画布区 ----
        canvas_frame = tk.Frame(root, relief=tk.SUNKEN, bd=2)
        canvas_frame.pack(padx=15, pady=5)

        self.canvas = tk.Canvas(
            canvas_frame, width=CANVAS_SIZE, height=CANVAS_SIZE,
            bg="white", cursor="cross",
        )
        self.canvas.pack()

        self.image = Image.new("RGB", (CANVAS_SIZE, CANVAS_SIZE), "white")
        self.draw = ImageDraw.Draw(self.image)

        self.canvas.bind("<B1-Motion>", self.paint)
        self.canvas.bind("<ButtonRelease-1>", self.reset_brush)

        self.last_x = None
        self.last_y = None
        self.realtime_var = tk.BooleanVar(value=False)

        # ---- 按钮区 ----
        btn_frame = tk.Frame(root)
        btn_frame.pack(pady=8)

        self.recognize_btn = tk.Button(
            btn_frame, text="识别", font=("微软雅黑", 14),
            width=8, command=self.recognize,
        )
        self.recognize_btn.pack(side=tk.LEFT, padx=5)

        self.clear_btn = tk.Button(
            btn_frame, text="清除", font=("微软雅黑", 14),
            width=8, command=self.clear_canvas,
        )
        self.clear_btn.pack(side=tk.LEFT, padx=5)

        self.upload_btn = tk.Button(
            btn_frame, text="上传图片", font=("微软雅黑", 14),
            width=8, command=self.upload_image,
        )
        self.upload_btn.pack(side=tk.LEFT, padx=5)

        # ---- 实时识别开关 ----
        rt_frame = tk.Frame(root)
        rt_frame.pack(pady=2)
        self.rt_check = tk.Checkbutton(
            rt_frame, text="实时识别（边写边识别）",
            variable=self.realtime_var, font=("微软雅黑", 10),
        )
        self.rt_check.pack()

        # ---- 结果显示 ----
        self.result_var = tk.StringVar()
        self.result_var.set("请在上方画布书写数字")
        result_label = tk.Label(
            root, textvariable=self.result_var,
            font=("微软雅黑", 28, "bold"), fg="#2b6cb0",
        )
        result_label.pack(pady=8)

        # ---- 概率分布图 ----
        self.prob_canvas = tk.Canvas(root, width=CANVAS_SIZE, height=110, bg="white")
        self.prob_canvas.pack(padx=15, pady=(0, 5))

        # ---- 底部工具栏 ----
        tool_frame = tk.Frame(root)
        tool_frame.pack(pady=5)

        self.curves_btn = tk.Button(
            tool_frame, text="训练曲线", font=("微软雅黑", 10),
            width=10, command=self.show_training_curves,
        )
        self.curves_btn.pack(side=tk.LEFT, padx=5)

        self.cm_btn = tk.Button(
            tool_frame, text="混淆矩阵", font=("微软雅黑", 10),
            width=10, command=self.show_confusion_matrix,
        )
        self.cm_btn.pack(side=tk.LEFT, padx=5)

        self.batch_btn = tk.Button(
            tool_frame, text="批量测试", font=("微软雅黑", 10),
            width=10, command=self.batch_test,
        )
        self.batch_btn.pack(side=tk.LEFT, padx=5)

        # ---- 底部说明 ----
        hint = tk.Label(
            root,
            text="操作: 鼠标书写数字 → 点识别 | 上传图片识别 | 勾选实时识别边写边认",
            font=("微软雅黑", 9), fg="gray",
        )
        hint.pack(pady=(0, 5))

    def paint(self, event):
        x, y = event.x, event.y
        if self.last_x is not None and self.last_y is not None:
            self.canvas.create_line(
                self.last_x, self.last_y, x, y,
                width=BRUSH_RADIUS * 2, fill="black",
                capstyle=tk.ROUND, smooth=True,
            )
            self.draw.line(
                [self.last_x, self.last_y, x, y],
                fill="black", width=BRUSH_RADIUS * 2,
            )
        self.last_x = x
        self.last_y = y

        if self.realtime_var.get():
            self.recognize()

    def reset_brush(self, event):
        self.last_x = None
        self.last_y = None

    def clear_canvas(self):
        self.canvas.delete("all")
        self.image = Image.new("RGB", (CANVAS_SIZE, CANVAS_SIZE), "white")
        self.draw = ImageDraw.Draw(self.image)
        self.result_var.set("请在上方画布书写数字")
        self.prob_canvas.delete("all")

    def recognize(self):
        if self.model is None:
            self.result_var.set("模型未加载")
            return

        pixels = self.image.getdata()
        if all(p == (255, 255, 255) for p in pixels):
            self.result_var.set("请先书写数字！")
            return

        try:
            pred_digit, prob_list = predict(self.image, self.model, self.device)
            self.result_var.set(f"识别结果: {pred_digit}")
            self.draw_prob_bars(prob_list)
        except Exception as e:
            self.result_var.set(f"识别出错: {e}")

    def draw_prob_bars(self, probs):
        self.prob_canvas.delete("all")
        canvas_w = CANVAS_SIZE
        canvas_h = 110
        bar_width = canvas_w / 11
        max_height = canvas_h - 30
        best_idx = probs.index(max(probs))

        for i, prob in enumerate(probs):
            x0 = i * bar_width + bar_width * 0.5
            x1 = x0 + bar_width * 0.6
            bar_h = int(prob * max_height)
            y0 = canvas_h - 20 - bar_h
            y1 = canvas_h - 20

            color = "#e53e3e" if i == best_idx else "#2b6cb0"
            self.prob_canvas.create_rectangle(x0, y0, x1, y1, fill=color, outline="")

            self.prob_canvas.create_text(
                (x0 + x1) / 2, canvas_h - 10,
                text=str(i), font=("Arial", 9),
            )
            if prob > 0.01:
                self.prob_canvas.create_text(
                    (x0 + x1) / 2, y0 - 8,
                    text=f"{prob*100:.0f}%", font=("Arial", 7), fill="gray",
                )

    def upload_image(self):
        filepath = filedialog.askopenfilename(
            title="选择图片",
            filetypes=[("图片文件", "*.png *.jpg *.jpeg *.bmp *.gif")],
        )
        if not filepath:
            return

        try:
            img = Image.open(filepath)
        except Exception:
            messagebox.showerror("错误", "无法打开图片文件")
            return

        self.clear_canvas()
        self.image = img.copy()
        resized = img.resize((CANVAS_SIZE, CANVAS_SIZE), Image.LANCZOS)
        self.image = resized.convert("RGB")

        self.canvas.delete("all")
        tk_img = ImageTk.PhotoImage(resized)
        self.canvas.create_image(0, 0, anchor=tk.NW, image=tk_img)
        self.canvas.image = tk_img
        self.draw = ImageDraw.Draw(self.image)

        self.recognize()

    def show_training_curves(self):
        plot_training_curves()
        path = os.path.join(os.path.dirname(__file__), "models", "training_curves.png")
        self.show_image_window(path, "训练曲线")

    def show_confusion_matrix(self):
        plot_confusion_matrix()
        path = os.path.join(os.path.dirname(__file__), "models", "confusion_matrix.png")
        self.show_image_window(path, "混淆矩阵")

    def show_image_window(self, image_path, title):
        if not os.path.exists(image_path):
            messagebox.showwarning("提示", f"图片不存在: {image_path}\n请先运行 train.py 和 visualize.py")
            return
        win = tk.Toplevel(self.root)
        win.title(title)
        img = Image.open(image_path)
        w, h = img.size
        max_w, max_h = 800, 600
        if w > max_w or h > max_h:
            ratio = min(max_w / w, max_h / h)
            img = img.resize((int(w * ratio), int(h * ratio)), Image.LANCZOS)
        tk_img = ImageTk.PhotoImage(img)
        label = tk.Label(win, image=tk_img)
        label.pack()
        label.image = tk_img
        win.image = tk_img
        win.update()

    def batch_test(self):
        if self.model is None:
            messagebox.showwarning("提示", "模型未加载")
            return

        from torchvision import datasets
        data_dir = os.path.join(os.path.dirname(__file__), "data")
        test_set = datasets.MNIST(data_dir, train=False, download=True)

        import random
        win = tk.Toplevel(self.root)
        win.title("批量测试 - 随机抽取20张测试集图片")
        win.resizable(False, False)

        indices = random.sample(range(len(test_set)), 20)
        correct = 0

        for idx_pos, img_idx in enumerate(indices):
            pil_img, label = test_set[img_idx]

            row = idx_pos // 5
            col = idx_pos % 5

            frame = tk.Frame(win, relief=tk.RIDGE, bd=1)
            frame.grid(row=row, column=col, padx=3, pady=3)

            resized = pil_img.resize((60, 60), Image.LANCZOS)
            tk_img = ImageTk.PhotoImage(resized)
            img_label = tk.Label(frame, image=tk_img)
            img_label.pack()
            img_label.image = tk_img

            pred_digit, _ = predict(pil_img, self.model, self.device)
            is_correct = pred_digit == label
            if is_correct:
                correct += 1

            result_text = f"真:{label} 预:{pred_digit}"
            color = "green" if is_correct else "red"
            tk.Label(frame, text=result_text, font=("Arial", 9), fg=color).pack()

        accuracy = correct / 20 * 100
        tk.Label(
            win,
            text=f"批量测试结果: {correct}/20 正确, 准确率 {accuracy:.1f}%",
            font=("微软雅黑", 14, "bold"), fg="#2b6cb0",
        ).grid(row=4, column=0, columnspan=5, pady=10)


def main():
    root = tk.Tk()
    app = DigitRecognizerApp(root)
    root.mainloop()


if __name__ == "__main__":
    main()
