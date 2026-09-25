import os
import json

import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import numpy as np

plt.rcParams["font.sans-serif"] = ["SimHei", "Microsoft YaHei"]
plt.rcParams["axes.unicode_minus"] = False

MODEL_DIR = os.path.join(os.path.dirname(__file__), "models")
HISTORY_PATH = os.path.join(MODEL_DIR, "history.json")


def plot_training_curves():
    if not os.path.exists(HISTORY_PATH):
        print("找不到训练历史文件，请先运行 train.py")
        return
    with open(HISTORY_PATH, "r", encoding="utf-8") as f:
        history = json.load(f)

    epochs = range(1, len(history["train_loss"]) + 1)

    fig, axes = plt.subplots(1, 2, figsize=(14, 5))

    # 损失曲线
    axes[0].plot(epochs, history["train_loss"], "b-o", label="训练损失", markersize=4)
    axes[0].plot(epochs, history["test_loss"], "r-s", label="测试损失", markersize=4)
    axes[0].set_xlabel("Epoch")
    axes[0].set_ylabel("Loss")
    axes[0].set_title("训练与测试损失曲线")
    axes[0].legend()
    axes[0].grid(True, alpha=0.3)

    # 准确率曲线
    axes[1].plot(epochs, history["test_acc"], "g-^", label="测试准确率", markersize=4)
    axes[1].set_xlabel("Epoch")
    axes[1].set_ylabel("准确率 (%)")
    axes[1].set_title("测试准确率曲线")
    axes[1].legend()
    axes[1].grid(True, alpha=0.3)
    axes[1].set_ylim(95, 100)

    plt.tight_layout()
    save_path = os.path.join(MODEL_DIR, "training_curves.png")
    plt.savefig(save_path, dpi=150, bbox_inches="tight")
    plt.close()
    print(f"训练曲线已保存至: {save_path}")


def plot_confusion_matrix():
    if not os.path.exists(HISTORY_PATH):
        print("找不到训练历史文件，请先运行 train.py")
        return
    with open(HISTORY_PATH, "r", encoding="utf-8") as f:
        history = json.load(f)

    cm = np.array(history.get("confusion_matrix", []))
    if cm.size == 0:
        print("训练历史中没有混淆矩阵数据")
        return

    fig, ax = plt.subplots(figsize=(8, 7))
    im = ax.imshow(cm, cmap="Blues")

    for i in range(10):
        for j in range(10):
            color = "white" if cm[i][j] > cm.max() * 0.5 else "black"
            ax.text(j, i, str(cm[i][j]), ha="center", va="center", color=color, fontsize=9)

    ax.set_xticks(range(10))
    ax.set_yticks(range(10))
    ax.set_xlabel("预测值")
    ax.set_ylabel("真实值")
    ax.set_title("混淆矩阵")
    fig.colorbar(im, ax=ax, fraction=0.046, pad=0.04)

    plt.tight_layout()
    save_path = os.path.join(MODEL_DIR, "confusion_matrix.png")
    plt.savefig(save_path, dpi=150, bbox_inches="tight")
    plt.close()
    print(f"混淆矩阵已保存至: {save_path}")


def main():
    plot_training_curves()
    plot_confusion_matrix()


if __name__ == "__main__":
    main()
