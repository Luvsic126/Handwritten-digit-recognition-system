import os

import torch
import torch.nn.functional as F
import numpy as np
from PIL import Image, ImageOps
from torchvision import transforms

from model import MnistCnn

MODEL_PATH = os.path.join(os.path.dirname(__file__), "models", "mnist_cnn.pth")

_normalize = transforms.Compose([
    transforms.ToTensor(),
    transforms.Normalize((0.1307,), (0.3081,)),
])


def load_model(device=None):
    if device is None:
        device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    model = MnistCnn().to(device)
    model.load_state_dict(torch.load(MODEL_PATH, map_location=device))
    model.eval()
    return model, device


def preprocess(pil_image):
    """模仿MNIST的预处理流程：裁剪有效区域 -> 居中缩放到28x28"""
    gray = pil_image.convert("L")

    # 智能判断是否需要反色：MNIST是黑底白字(深色背景)
    # 手写画布是白底黑字(浅色背景)，需要反色
    arr_check = np.array(gray)
    avg_brightness = arr_check.mean()
    if avg_brightness > 127:
        # 白底黑字，需要反色
        gray = ImageOps.invert(gray)

    arr = np.array(gray)
    rows = np.any(arr > 30, axis=1)
    cols = np.any(arr > 30, axis=0)

    if not rows.any() or not cols.any():
        return torch.zeros(1, 1, 28, 28)

    rmin, rmax = np.where(rows)[0][[0, -1]]
    cmin, cmax = np.where(cols)[0][[0, -1]]

    # 稍微扩大边界，避免笔画被裁掉
    pad = 3
    rmin = max(0, rmin - pad)
    rmax = min(arr.shape[0] - 1, rmax + pad)
    cmin = max(0, cmin - pad)
    cmax = min(arr.shape[1] - 1, cmax + pad)

    cropped = gray.crop((cmin, rmin, cmax + 1, rmax + 1))

    # 保持比例缩放到20x20，再居中放入28x28
    w, h = cropped.size
    scale = 20.0 / max(w, h)
    new_w = max(1, int(w * scale))
    new_h = max(1, int(h * scale))
    resized = cropped.resize((new_w, new_h), Image.LANCZOS)

    canvas = Image.new("L", (28, 28), 0)
    offset_x = (28 - new_w) // 2
    offset_y = (28 - new_h) // 2
    canvas.paste(resized, (offset_x, offset_y))

    return _normalize(canvas).unsqueeze(0)


def predict(pil_image, model=None, device=None):
    if model is None:
        model, device = load_model()
    tensor = preprocess(pil_image).to(device)
    with torch.no_grad():
        output = model(tensor)
        probs = F.softmax(output, dim=1).squeeze().cpu()
    pred_digit = probs.argmax().item()
    prob_list = probs.tolist()
    return pred_digit, prob_list
