import os
import json

import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import DataLoader
from torchvision import datasets, transforms
from model import MnistCnn

BATCH_SIZE = 64
EPOCHS = 15
LEARNING_RATE = 1e-3
DATA_DIR = os.path.join(os.path.dirname(__file__), "data")
MODEL_DIR = os.path.join(os.path.dirname(__file__), "models")
MODEL_PATH = os.path.join(MODEL_DIR, "mnist_cnn.pth")
HISTORY_PATH = os.path.join(MODEL_DIR, "history.json")


def get_loaders():
    train_transform = transforms.Compose([
        transforms.RandomAffine(degrees=10, translate=(0.1, 0.1), scale=(0.9, 1.1)),
        transforms.ToTensor(),
        transforms.Normalize((0.1307,), (0.3081,)),
    ])
    test_transform = transforms.Compose([
        transforms.ToTensor(),
        transforms.Normalize((0.1307,), (0.3081,)),
    ])
    train_set = datasets.MNIST(DATA_DIR, train=True, download=True, transform=train_transform)
    test_set = datasets.MNIST(DATA_DIR, train=False, download=True, transform=test_transform)
    train_loader = DataLoader(train_set, batch_size=BATCH_SIZE, shuffle=True)
    test_loader = DataLoader(test_set, batch_size=BATCH_SIZE, shuffle=False)
    return train_loader, test_loader


def train_one_epoch(model, loader, optimizer, criterion, device):
    model.train()
    running_loss = 0.0
    for batch_idx, (data, target) in enumerate(loader):
        data, target = data.to(device), target.to(device)
        optimizer.zero_grad()
        output = model(data)
        loss = criterion(output, target)
        loss.backward()
        optimizer.step()
        running_loss += loss.item()
        if (batch_idx + 1) % 200 == 0:
            print(f"  Batch {batch_idx + 1}/{len(loader)}, Loss: {loss.item():.4f}")
    return running_loss / len(loader)


def evaluate(model, loader, criterion, device):
    model.eval()
    test_loss = 0.0
    correct = 0
    with torch.no_grad():
        for data, target in loader:
            data, target = data.to(device), target.to(device)
            output = model(data)
            test_loss += criterion(output, target).item()
            pred = output.argmax(dim=1)
            correct += pred.eq(target).sum().item()
    avg_loss = test_loss / len(loader)
    accuracy = 100.0 * correct / len(loader.dataset)
    return avg_loss, accuracy


def get_confusion_matrix(model, loader, device):
    model.eval()
    matrix = torch.zeros(10, 10, dtype=torch.int64)
    with torch.no_grad():
        for data, target in loader:
            data = data.to(device)
            output = model(data)
            pred = output.argmax(dim=1).cpu()
            for t, p in zip(target, pred):
                matrix[t][p] += 1
    return matrix.numpy().tolist()


def main():
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print(f"使用设备: {device}")

    os.makedirs(MODEL_DIR, exist_ok=True)

    train_loader, test_loader = get_loaders()
    print(f"训练集大小: {len(train_loader.dataset)}, 测试集大小: {len(test_loader.dataset)}")

    model = MnistCnn().to(device)
    optimizer = optim.Adam(model.parameters(), lr=LEARNING_RATE)
    criterion = nn.NLLLoss()

    history = {"train_loss": [], "test_loss": [], "test_acc": []}
    best_acc = 0.0

    for epoch in range(1, EPOCHS + 1):
        print(f"\nEpoch {epoch}/{EPOCHS}")
        print("-" * 40)
        train_loss = train_one_epoch(model, train_loader, optimizer, criterion, device)
        test_loss, test_acc = evaluate(model, test_loader, criterion, device)
        print(f"  训练损失: {train_loss:.4f}")
        print(f"  测试损失: {test_loss:.4f}, 准确率: {test_acc:.2f}%")

        history["train_loss"].append(round(train_loss, 4))
        history["test_loss"].append(round(test_loss, 4))
        history["test_acc"].append(round(test_acc, 2))

        if test_acc > best_acc:
            best_acc = test_acc
            torch.save(model.state_dict(), MODEL_PATH)
            print(f"  >> 保存最佳模型 (准确率 {best_acc:.2f}%)")

    cm = get_confusion_matrix(model, test_loader, device)
    history["confusion_matrix"] = cm
    with open(HISTORY_PATH, "w", encoding="utf-8") as f:
        json.dump(history, f, ensure_ascii=False, indent=2)

    print(f"\n训练完成！最佳准确率: {best_acc:.2f}%")
    print(f"模型已保存至: {MODEL_PATH}")
    print(f"训练历史已保存至: {HISTORY_PATH}")


if __name__ == "__main__":
    main()
