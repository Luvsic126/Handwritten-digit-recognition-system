# 手写数字识别系统

基于 MNIST 数据集 + 卷积神经网络 (CNN) 的手写数字识别应用，提供 Tkinter GUI 交互界面。

## 项目结构

```
mnist-digit-recognizer/
├── model.py          # CNN模型定义
├── train.py          # 模型训练脚本（含数据增强）
├── predict.py        # 预测工具模块（含MNIST标准预处理）
├── visualize.py      # 训练曲线与混淆矩阵可视化
├── app.py            # Tkinter GUI主程序
├── requirements.txt  # 依赖列表
├── README.md         # 使用说明
├── data/             # MNIST数据集(自动下载)
└── models/           # 模型与可视化文件
    ├── mnist_cnn.pth         # 训练好的模型
    ├── history.json           # 训练历史数据
    ├── training_curves.png    # 训练曲线图
    └── confusion_matrix.png   # 混淆矩阵图
```

## 环境配置

```bash
pip install -r requirements.txt
```

## 使用步骤

### 1. 训练模型
```bash
python train.py
```
- 自动下载MNIST数据集
- 使用数据增强（随机旋转、平移、缩放）提升泛化能力
- 15个epoch，训练完成后自动保存最佳模型
- 同时保存训练历史和混淆矩阵数据

### 2. 生成可视化图表
```bash
python visualize.py
```
- 生成训练损失/准确率曲线图
- 生成混淆矩阵图

### 3. 启动应用
```bash
python app.py
```

## 功能列表

| 功能 | 说明 |
|------|------|
| 手写识别 | 鼠标在画布上书写数字，点击"识别"按钮 |
| 实时识别 | 勾选后边写边识别，无需点按钮 |
| 上传图片 | 支持上传png/jpg等图片文件进行识别 |
| 批量测试 | 随机抽取20张MNIST测试集图片，展示识别结果 |
| 训练曲线 | 查看训练过程中的loss和accuracy变化 |
| 混淆矩阵 | 查看模型在各类别上的识别表现 |
| 概率分布 | 每次识别后显示0-9各数字的概率柱状图 |

## 技术说明

| 项目 | 说明 |
|------|------|
| 数据集 | MNIST (60000训练 + 10000测试, 28x28灰度图) |
| 数据增强 | RandomAffine: 旋转±10°, 平移10%, 缩放90%-110% |
| 模型 | 2层卷积(Conv2d) + 2层全连接(Linear), 约42万参数 |
| 优化器 | Adam, 学习率1e-3 |
| 损失函数 | 负对数似然损失(NLLLoss) |
| 预处理 | 裁剪有效区域 → 等比缩放至20x20 → 居中放入28x28 |
| 测试准确率 | 99.42% |
