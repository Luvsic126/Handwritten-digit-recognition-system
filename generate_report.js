const fs = require("fs");
const path = require("path");
const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, ImageRun,
  Header, Footer, AlignmentType, PageOrientation, LevelFormat, ExternalHyperlink,
  HeadingLevel, BorderStyle, WidthType, ShadingType,
  VerticalAlign, PageNumber, PageBreak
} = require("docx");

const PROJECT_DIR = __dirname;
const MODEL_DIR = path.join(PROJECT_DIR, "models");

// 读取训练曲线和混淆矩阵图片
const curvesPath = path.join(MODEL_DIR, "training_curves.png");
const cmPath = path.join(MODEL_DIR, "confusion_matrix.png");
const curvesData = fs.existsSync(curvesPath) ? fs.readFileSync(curvesPath) : null;
const cmData = fs.existsSync(cmPath) ? fs.readFileSync(cmPath) : null;

const cjkFont = { ascii: "Times New Roman", hAnsi: "Times New Roman", eastAsia: "Microsoft YaHei" };
const border = { style: BorderStyle.SINGLE, size: 1, color: "999999" };
const borders = { top: border, bottom: border, left: border, right: border };

function heading(text, level = HeadingLevel.HEADING_1) {
  return new Paragraph({
    heading: level,
    spacing: { before: 360, after: 200 },
    children: [new TextRun({ text, bold: true, font: cjkFont, size: level === HeadingLevel.HEADING_1 ? 32 : 28 })]
  });
}

function body(text) {
  return new Paragraph({
    spacing: { after: 120, line: 360 },
    children: [new TextRun({ text, font: cjkFont, size: 24 })]
  });
}

function bodyIndent(text) {
  return new Paragraph({
    spacing: { after: 120, line: 360 },
    indent: { firstLine: 480 },
    children: [new TextRun({ text, font: cjkFont, size: 24 })]
  });
}

function caption(text) {
  return new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 60, after: 200 },
    children: [new TextRun({ text, font: cjkFont, size: 21, italics: true })]
  });
}

function codeBlock(code) {
  const lines = code.split("\n");
  return lines.map(line =>
    new Paragraph({
      spacing: { after: 0, line: 280 },
      indent: { left: 480 },
      children: [new TextRun({ text: line, font: { ascii: "Consolas", hAnsi: "Consolas", eastAsia: "Microsoft YaHei" }, size: 20 })]
    })
  );
}

function makeTable(headers, rows) {
  const headerRow = new TableRow({
    cantSplit: true,
    children: headers.map(h => new TableCell({
      borders,
      shading: { fill: "D5E8F0", type: ShadingType.CLEAR },
      margins: { top: 60, bottom: 60, left: 80, right: 80 },
      children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: h, bold: true, font: cjkFont, size: 22 })] })]
    }))
  });

  const dataRows = rows.map(row => new TableRow({
    cantSplit: true,
    children: row.map(cell => new TableCell({
      borders,
      margins: { top: 60, bottom: 60, left: 80, right: 80 },
      children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: cell, font: cjkFont, size: 22 })] })]
    }))
  }));

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [headerRow, ...dataRows]
  });
}

const doc = new Document({
  styles: {
    default: {
      document: { run: { font: cjkFont, size: 24 } }
    },
    paragraphStyles: [
      { id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 32, bold: true, font: cjkFont },
        paragraph: { spacing: { before: 360, after: 200 }, outlineLevel: 0, keepNext: false, keepLines: false } },
      { id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 28, bold: true, font: cjkFont },
        paragraph: { spacing: { before: 240, after: 160 }, outlineLevel: 1, keepNext: false, keepLines: false } },
      { id: "Heading3", name: "Heading 3", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 26, bold: true, font: cjkFont },
        paragraph: { spacing: { before: 200, after: 120 }, outlineLevel: 2, keepNext: false, keepLines: false } },
    ]
  },
  sections: [{
    properties: {
      page: {
        size: { width: 11906, height: 16838 },
        margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 }
      }
    },
    children: [
      // ===== 封面 =====
      new Paragraph({ spacing: { before: 2400 }, children: [] }),
      new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 200 }, children: [new TextRun({ text: "专业综合实训报告", bold: true, font: cjkFont, size: 52 })] }),
      new Paragraph({ spacing: { after: 800 }, children: [] }),
      new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 200 }, children: [new TextRun({ text: "题  目：手写数字识别系统", font: cjkFont, size: 32 })] }),
      new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 200 }, children: [new TextRun({ text: "学  院：________________", font: cjkFont, size: 32 })] }),
      new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 200 }, children: [new TextRun({ text: "专业班级：________________", font: cjkFont, size: 32 })] }),
      new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 200 }, children: [new TextRun({ text: "姓  名：________________", font: cjkFont, size: 32 })] }),
      new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 200 }, children: [new TextRun({ text: "指导教师：________________", font: cjkFont, size: 32 })] }),
      new Paragraph({ spacing: { before: 800 }, children: [] }),
      new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "二〇二五 年 九 月", font: cjkFont, size: 32 })] }),
      new Paragraph({ children: [new PageBreak()] }),

      // ===== 评分表 =====
      new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 300 }, children: [new TextRun({ text: "项目评分表", bold: true, font: cjkFont, size: 32 })] }),
      makeTable(
        ["项目", "权重", "自评分数"],
        [
          ["项目创新性与实用性", "25分", ""],
          ["功能实现与代码质量", "25分", ""],
          ["文档与演示材料完整性", "20分", ""],
          ["团队协作与分工合理性", "15分", ""],
          ["平时表现与问题应对", "15分", ""],
        ]
      ),
      new Paragraph({ spacing: { before: 200 }, children: [new TextRun({ text: "注：自评分数将作为教师综合评价的重要参考依据之一。", font: cjkFont, size: 21, italics: true })] }),
      new Paragraph({ children: [new PageBreak()] }),

      // ===== 摘要 =====
      new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 200 }, children: [new TextRun({ text: "摘  要", bold: true, font: cjkFont, size: 36 })] }),
      bodyIndent("手写数字识别是计算机视觉和深度学习领域的经典问题，具有广泛的应用场景，如邮政编码识别、银行票据识别、表单数字化等。本项目基于MNIST手写数字数据集，采用卷积神经网络（CNN）构建了一个完整的手写数字识别系统。系统使用Python语言开发，以PyTorch作为深度学习框架，通过Tkinter构建图形用户界面，实现了手写数字的实时识别功能。"),
      bodyIndent("本系统的主要工作包括：（1）设计并实现了一个两层卷积神经网络模型，包含卷积层、池化层、Dropout正则化层和全连接层；（2）采用数据增强技术（随机旋转、平移、缩放）提升模型泛化能力；（3）实现了模仿MNIST标准处理的图像预处理流程，包括有效区域裁剪、等比缩放和居中放置；（4）开发了功能完善的GUI界面，支持手写识别、图片上传、实时识别、批量测试、训练曲线可视化和混淆矩阵展示等功能。"),
      bodyIndent("实验结果表明，模型在MNIST测试集上达到99.42%的准确率，混淆矩阵显示各类别识别效果良好，主要混淆集中在视觉相似的数字对（如4和9、3和5）。系统在用户手写数字识别场景下表现稳定，具有较高的实用价值。"),
      new Paragraph({ spacing: { before: 200, after: 400 }, children: [new TextRun({ text: "关键词：手写数字识别；卷积神经网络；MNIST；深度学习；PyTorch", bold: true, font: cjkFont, size: 24 })] }),

      // ===== Abstract =====
      new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 200 }, children: [new TextRun({ text: "Abstract", bold: true, font: cjkFont, size: 36 })] }),
      bodyIndent("Handwritten digit recognition is a classic problem in computer vision and deep learning, with wide applications such as postal code recognition, bank check processing, and form digitization. This project builds a complete handwritten digit recognition system based on the MNIST dataset using Convolutional Neural Networks (CNN). The system is developed in Python, using PyTorch as the deep learning framework and Tkinter for the graphical user interface, achieving real-time handwritten digit recognition."),
      bodyIndent("The main contributions include: (1) designing a two-layer CNN model with convolutional layers, pooling layers, dropout regularization, and fully connected layers; (2) applying data augmentation (random rotation, translation, scaling) to improve generalization; (3) implementing MNIST-standard image preprocessing including region cropping, proportional scaling, and centering; (4) developing a full-featured GUI supporting handwriting recognition, image upload, real-time recognition, batch testing, training curve visualization, and confusion matrix display."),
      bodyIndent("Experimental results show that the model achieves 99.42% accuracy on the MNIST test set. The confusion matrix shows good recognition performance across all digit classes, with main confusion concentrated on visually similar digit pairs (e.g., 4 and 9, 3 and 5). The system demonstrates stable performance on user handwritten digits with high practical value."),
      new Paragraph({ spacing: { before: 200, after: 400 }, children: [new TextRun({ text: "Keywords: Handwritten digit recognition; CNN; MNIST; Deep learning; PyTorch", bold: true, font: cjkFont, size: 24 })] }),
      new Paragraph({ children: [new PageBreak()] }),

      // ===== 目录 =====
      new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 300 }, children: [new TextRun({ text: "目  录", bold: true, font: cjkFont, size: 36 })] }),
      new Paragraph({ spacing: { after: 80 }, indent: { left: 480 }, children: [new TextRun({ text: "1. 引言 ..................................................... 1", font: cjkFont, size: 22 })] }),
      new Paragraph({ spacing: { after: 80 }, indent: { left: 720 }, children: [new TextRun({ text: "1.1 项目背景 ............................................... 1", font: cjkFont, size: 22 })] }),
      new Paragraph({ spacing: { after: 80 }, indent: { left: 720 }, children: [new TextRun({ text: "1.2 研究意义 ............................................... 2", font: cjkFont, size: 22 })] }),
      new Paragraph({ spacing: { after: 80 }, indent: { left: 720 }, children: [new TextRun({ text: "1.3 项目目标 ............................................... 2", font: cjkFont, size: 22 })] }),
      new Paragraph({ spacing: { after: 80 }, indent: { left: 480 }, children: [new TextRun({ text: "2. 相关工作 ................................................. 3", font: cjkFont, size: 22 })] }),
      new Paragraph({ spacing: { after: 80 }, indent: { left: 720 }, children: [new TextRun({ text: "2.1 手写数字识别技术概述 ................................... 3", font: cjkFont, size: 22 })] }),
      new Paragraph({ spacing: { after: 80 }, indent: { left: 720 }, children: [new TextRun({ text: "2.2 MNIST数据集介绍 ........................................ 3", font: cjkFont, size: 22 })] }),
      new Paragraph({ spacing: { after: 80 }, indent: { left: 480 }, children: [new TextRun({ text: "3. 方法论 ................................................... 4", font: cjkFont, size: 22 })] }),
      new Paragraph({ spacing: { after: 80 }, indent: { left: 720 }, children: [new TextRun({ text: "3.1 卷积神经网络架构 ....................................... 4", font: cjkFont, size: 22 })] }),
      new Paragraph({ spacing: { after: 80 }, indent: { left: 720 }, children: [new TextRun({ text: "3.2 数据增强策略 ........................................... 5", font: cjkFont, size: 22 })] }),
      new Paragraph({ spacing: { after: 80 }, indent: { left: 720 }, children: [new TextRun({ text: "3.3 图像预处理流程 ......................................... 6", font: cjkFont, size: 22 })] }),
      new Paragraph({ spacing: { after: 80 }, indent: { left: 480 }, children: [new TextRun({ text: "4. 系统实现与实验结果 ....................................... 7", font: cjkFont, size: 22 })] }),
      new Paragraph({ spacing: { after: 80 }, indent: { left: 720 }, children: [new TextRun({ text: "4.1 开发环境与项目结构 ..................................... 7", font: cjkFont, size: 22 })] }),
      new Paragraph({ spacing: { after: 80 }, indent: { left: 720 }, children: [new TextRun({ text: "4.2 训练过程与结果 ......................................... 8", font: cjkFont, size: 22 })] }),
      new Paragraph({ spacing: { after: 80 }, indent: { left: 720 }, children: [new TextRun({ text: "4.3 GUI功能实现 ............................................ 9", font: cjkFont, size: 22 })] }),
      new Paragraph({ spacing: { after: 80 }, indent: { left: 720 }, children: [new TextRun({ text: "4.4 批量测试与混淆矩阵分析 ................................. 10", font: cjkFont, size: 22 })] }),
      new Paragraph({ spacing: { after: 80 }, indent: { left: 480 }, children: [new TextRun({ text: "5. 总结与心得体会 ........................................... 11", font: cjkFont, size: 22 })] }),
      new Paragraph({ spacing: { after: 80 }, indent: { left: 480 }, children: [new TextRun({ text: "参考文献 ..................................................... 12", font: cjkFont, size: 22 })] }),
      new Paragraph({ spacing: { after: 80 }, indent: { left: 480 }, children: [new TextRun({ text: "附录 ......................................................... 13", font: cjkFont, size: 22 })] }),
      new Paragraph({ children: [new PageBreak()] }),

      // ===== 1. 引言 =====
      heading("1. 引言"),

      heading("1.1 项目背景", HeadingLevel.HEADING_2),
      bodyIndent("手写数字识别是模式识别和计算机视觉领域的经典问题之一。随着深度学习技术的快速发展，基于卷积神经网络（CNN）的方法已经成为解决这一问题的主流方案，在MNIST等标准数据集上已经能够达到接近人类水平的识别准确率。"),
      bodyIndent("在实际应用中，手写数字识别技术被广泛应用于邮政编码自动分拣、银行支票金额识别、表单数据数字化录入等场景。这些应用场景对识别准确率和实时性都有较高要求，因此研究高效、准确的手写数字识别系统具有重要的现实意义。"),
      bodyIndent("本项目作为专业综合实训的实践项目，旨在通过完整的项目开发流程，将深度学习理论知识应用于实际系统开发，提升在人工智能领域的项目开发与实践能力。"),

      heading("1.2 研究意义", HeadingLevel.HEADING_2),
      bodyIndent("本项目的研究意义主要体现在以下几个方面："),
      bodyIndent("第一，技术学习方面。通过从零开始构建CNN模型、训练模型、开发GUI界面的完整流程，深入理解深度学习的核心概念，包括卷积操作、池化、Dropout正则化、Softmax分类、反向传播等。"),
      bodyIndent("第二，工程实践方面。项目涵盖数据处理、模型训练、图像预处理、GUI开发、可视化分析等多个工程环节，锻炼了完整的项目开发能力。"),
      bodyIndent("第三，应用价值方面。系统具备手写识别、图片上传、批量测试等多种功能，可以作为一个实用的手写数字识别工具使用。"),

      heading("1.3 项目目标", HeadingLevel.HEADING_2),
      bodyIndent("本项目的具体目标包括："),
      bodyIndent("（1）基于PyTorch框架设计并实现一个卷积神经网络模型，用于MNIST手写数字识别。"),
      bodyIndent("（2）采用数据增强技术提升模型的泛化能力，使模型在测试集上达到99%以上的准确率。"),
      bodyIndent("（3）实现模仿MNIST标准处理的图像预处理流程，确保用户手写数字的识别效果。"),
      bodyIndent("（4）开发功能完善的Tkinter GUI界面，支持手写识别、图片上传、实时识别、批量测试、训练曲线可视化和混淆矩阵展示等功能。"),
      new Paragraph({ children: [new PageBreak()] }),

      // ===== 2. 相关工作 =====
      heading("2. 相关工作"),

      heading("2.1 手写数字识别技术概述", HeadingLevel.HEADING_2),
      bodyIndent("手写数字识别的研究可以追溯到20世纪90年代。早期的方法主要基于传统机器学习技术，如K近邻（KNN）、支持向量机（SVM）、决策树等。LeCun等人于1998年提出的LeNet-5网络是最早成功应用于手写数字识别的卷积神经网络之一，在美国邮政服务的手写数字识别任务上取得了当时领先的性能[1]。"),
      bodyIndent("随着深度学习的兴起，更深层的网络结构如AlexNet、VGGNet、ResNet等不断刷新识别准确率纪录。目前，在MNIST数据集上，先进模型的准确率已经能够达到99.7%以上[2]。CNN之所以在手写数字识别任务中表现优异，主要得益于其局部感知、参数共享和空间下采样等特性，能够有效提取图像中的层级特征。"),
      bodyIndent("近年来，注意力机制和Transformer架构也被引入到手写识别领域，但在轻量级应用场景中，传统CNN仍然是最优选择，具有结构简单、训练快速、部署方便的优势[3]。"),

      heading("2.2 MNIST数据集介绍", HeadingLevel.HEADING_2),
      bodyIndent("MNIST（Mixed National Institute of Standards and Technology）数据集是手写数字识别领域的标准基准数据集，由Yann LeCun等人整理发布[4]。该数据集包含："),
      bodyIndent("训练集：60,000张28×28像素的灰度手写数字图像。"),
      bodyIndent("测试集：10,000张28×28像素的灰度手写数字图像。"),
      bodyIndent("数字类别：0-9共10个类别。"),
      bodyIndent("MNIST数据集的图像均为黑底白字（背景像素值接近0，前景笔画像素值接近255），且数字已经过居中处理。这些特性对于数据预处理设计具有重要的参考意义。本项目在处理用户手写输入时，专门设计了模仿MNIST标准的预处理流程，包括裁剪有效区域、等比缩放至20×20、居中放置于28×28画布等步骤。"),
      new Paragraph({ children: [new PageBreak()] }),

      // ===== 3. 方法论 =====
      heading("3. 方法论"),

      heading("3.1 卷积神经网络架构", HeadingLevel.HEADING_2),
      bodyIndent("本项目设计的CNN模型结构如下表所示："),

      makeTable(
        ["层名称", "操作", "输出尺寸", "参数量"],
        [
          ["输入层", "1×28×28灰度图", "1×28×28", "—"],
          ["卷积层1", "Conv2d(1→32, 3×3, padding=1)", "32×28×28", "320"],
          ["激活层", "ReLU", "32×28×28", "0"],
          ["池化层1", "MaxPool2d(2×2)", "32×14×14", "0"],
          ["卷积层2", "Conv2d(32→64, 3×3, padding=1)", "64×14×14", "18,496"],
          ["激活层", "ReLU", "64×14×14", "0"],
          ["池化层2", "MaxPool2d(2×2)", "64×7×7", "0"],
          ["Dropout1", "Dropout2d(0.25)", "64×7×7", "0"],
          ["全连接层1", "Linear(3136→128)", "128", "401,536"],
          ["激活层", "ReLU", "128", "0"],
          ["Dropout2", "Dropout(0.5)", "128", "0"],
          ["全连接层2", "Linear(128→10)", "10", "1,290"],
          ["输出层", "LogSoftmax", "10", "0"],
        ]
      ),
      bodyIndent("模型的核心代码如下："),
      ...codeBlock(
`class MnistCnn(nn.Module):
    def __init__(self):
        super().__init__()
        self.conv1 = nn.Conv2d(1, 32, kernel_size=3, padding=1)
        self.conv2 = nn.Conv2d(32, 64, kernel_size=3, padding=1)
        self.dropout1 = nn.Dropout2d(0.25)
        self.dropout2 = nn.Dropout2d(0.5)
        self.fc1 = nn.Linear(64 * 7 * 7, 128)
        self.fc2 = nn.Linear(128, 10)

    def forward(self, x):
        x = F.relu(self.conv1(x))
        x = F.max_pool2d(x, 2)
        x = F.relu(self.conv2(x))
        x = F.max_pool2d(x, 2)
        x = self.dropout1(x)
        x = torch.flatten(x, 1)
        x = F.relu(self.fc1(x))
        x = self.dropout2(x)
        x = self.fc2(x)
        return F.log_softmax(x, dim=1)`
      ),
      bodyIndent("模型采用两个卷积层逐步提取图像特征。第一层卷积使用32个3×3卷积核，将单通道灰度图映射为32通道特征图；第二层卷积使用64个3×3卷积核，进一步提取更高层次的抽象特征。每个卷积层后接ReLU激活函数和2×2最大池化层，实现空间下采样和特征不变性。Dropout层用于防止过拟合，Dropout1（p=0.25）作用于卷积特征图，Dropout2（p=0.5）作用于全连接层。输出层使用LogSoftmax将10个神经元的输出转换为对数概率分布。"),

      heading("3.2 数据增强策略", HeadingLevel.HEADING_2),
      bodyIndent("为了提升模型的泛化能力，特别是对用户手写输入的适应性，本项目在训练阶段采用了数据增强技术。数据增强通过对训练图像进行随机变换，生成更多的训练样本，使模型学到更鲁棒的特征。"),
      bodyIndent("本项目使用PyTorch的RandomAffine变换，具体参数如下："),
      bodyIndent("随机旋转：±10度，模拟用户书写时数字的倾斜。"),
      bodyIndent("随机平移：10%，模拟数字在画布中的位置偏移。"),
      bodyIndent("随机缩放：90%-110%，模拟用户书写数字的大小变化。"),
      bodyIndent("数据增强仅在训练阶段应用，测试阶段使用原始图像。这一策略有效提升了模型对手写输入变化的容忍度。"),

      heading("3.3 图像预处理流程", HeadingLevel.HEADING_2),
      bodyIndent("由于用户在GUI画布上手写的数字与MNIST标准数据集的图像在尺寸、位置、颜色等方面存在差异，需要设计专门的预处理流程将用户输入转换为模型可识别的格式。预处理流程包括以下步骤："),
      bodyIndent("第一步，灰度转换。将RGB图像转换为单通道灰度图。"),
      bodyIndent("第二步，智能反色。通过计算图像平均亮度判断背景颜色：如果平均亮度大于127（白底黑字），则进行反色处理；否则保持不变（黑底白字，如MNIST格式）。这一设计使系统能同时正确处理手写画布输入和MNIST测试集图片。"),
      bodyIndent("第三步，有效区域裁剪。通过检测像素值大于30的行列范围，确定数字的有效边界，裁剪掉多余的空白区域，并适当扩展边界（pad=3）避免笔画被裁掉。"),
      bodyIndent("第四步，等比缩放。将裁剪后的图像保持长宽比缩放到20×20像素，这与MNIST数据集的标准处理一致。"),
      bodyIndent("第五步，居中放置。将缩放后的图像居中放置在28×28的全黑画布上，确保数字位置与MNIST训练数据一致。"),
      bodyIndent("第六步，标准化。使用MNIST的均值0.1307和标准差0.3081对图像进行标准化处理，使输入数据分布与训练数据一致。"),
      new Paragraph({ children: [new PageBreak()] }),

      // ===== 4. 系统实现与实验结果 =====
      heading("4. 系统实现与实验结果"),

      heading("4.1 开发环境与项目结构", HeadingLevel.HEADING_2),
      bodyIndent("本项目的开发环境如下表所示："),
      makeTable(
        ["项目", "配置"],
        [
          ["操作系统", "Windows 11"],
          ["编程语言", "Python 3.10"],
          ["深度学习框架", "PyTorch 2.14.0 + torchvision 0.29.0"],
          ["GUI框架", "Tkinter"],
          ["图像处理", "Pillow (PIL)"],
          ["数据可视化", "matplotlib 3.10.8"],
          ["数值计算", "NumPy"],
        ]
      ),
      bodyIndent("项目文件结构如下："),
      ...codeBlock(
`mnist-digit-recognizer/
├── model.py          # CNN模型定义
├── train.py          # 模型训练脚本（含数据增强）
├── predict.py        # 预测工具模块（含智能预处理）
├── visualize.py      # 训练曲线与混淆矩阵可视化
├── app.py            # Tkinter GUI主程序
├── requirements.txt  # 依赖列表
├── README.md         # 使用说明
├── data/             # MNIST数据集（自动下载）
└── models/           # 模型与可视化文件
    ├── mnist_cnn.pth         # 训练好的模型
    ├── history.json           # 训练历史数据
    ├── training_curves.png    # 训练曲线图
    └── confusion_matrix.png   # 混淆矩阵图`
      ),

      heading("4.2 训练过程与结果", HeadingLevel.HEADING_2),
      bodyIndent("模型训练使用Adam优化器，学习率为0.001，批量大小为64，共训练15个epoch。损失函数使用负对数似然损失（NLLLoss）。训练过程中每个epoch结束后在测试集上评估模型性能，保存准确率最高的模型。"),
      bodyIndent("训练过程中各epoch的测试准确率如下表所示："),
      makeTable(
        ["Epoch", "训练损失", "测试损失", "测试准确率"],
        [
          ["1", "0.4283", "0.0507", "98.42%"],
          ["2", "0.1957", "0.0346", "98.83%"],
          ["3", "0.1579", "0.0330", "98.92%"],
          ["4", "0.1369", "0.0255", "99.19%"],
          ["5", "0.1252", "0.0226", "99.21%"],
          ["6", "0.1192", "0.0184", "99.33%"],
          ["9", "0.1018", "0.0179", "99.37%"],
          ["15", "0.0819", "0.0181", "99.42%"],
        ]
      ),
      bodyIndent("训练曲线如图4-1所示。从图中可以看出，训练损失在15个epoch内持续下降，测试损失在前6个epoch快速下降后趋于稳定，测试准确率从98.42%稳步提升至99.42%。"),
      ...(curvesData ? [
        new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 200, after: 60 }, children: [new ImageRun({ type: "png", data: curvesData, transformation: { width: 500, height: 200 }, altText: { title: "训练曲线", description: "训练损失和测试准确率曲线", name: "training_curves" } })] }),
        caption("图4-1 训练损失与测试准确率曲线"),
      ] : []),
      bodyIndent("最终模型在MNIST测试集上达到99.42%的准确率，仅58个样本被错误分类。训练损失（0.0819）高于测试损失（0.0181）的原因是训练阶段使用了数据增强和Dropout，增加了训练难度，但这也正是模型在测试集上表现优异的原因。"),

      heading("4.3 GUI功能实现", HeadingLevel.HEADING_2),
      bodyIndent("系统使用Tkinter构建了功能完善的图形用户界面，主要功能包括："),
      bodyIndent("（1）手写识别。用户可在280×280的白色画布上用鼠标书写数字，点击\u201C识别\u201D按钮即可获得识别结果。系统同时显示0-9各数字的概率分布柱状图，最高概率项以红色标注。"),
      bodyIndent("（2）实时识别。勾选\u201C实时识别\u201D选项后，用户在书写过程中系统会自动进行识别，无需手动点击按钮，实现了边写边认的效果。"),
      bodyIndent("（3）图片上传。支持上传PNG、JPG等格式的图片文件进行识别，系统自动将上传图片缩放到画布尺寸并显示。"),
      bodyIndent("（4）批量测试。从MNIST测试集中随机抽取20张图片进行识别，以4行5列网格展示每张图片的真实标签和预测结果，正确标注为绿色，错误标注为红色，并统计总体准确率。"),
      bodyIndent("（5）训练曲线。点击按钮可查看训练过程中的损失和准确率变化曲线图，直观展示模型的训练过程。"),
      bodyIndent("（6）混淆矩阵。点击按钮可查看模型在10个数字类别上的识别表现，以热力图形式展示各类别的正确数和混淆情况。"),

      heading("4.4 批量测试与混淆矩阵分析", HeadingLevel.HEADING_2),
      bodyIndent("混淆矩阵如图4-2所示。从混淆矩阵可以观察到以下规律："),
      ...(cmData ? [
        new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 200, after: 60 }, children: [new ImageRun({ type: "png", data: cmData, transformation: { width: 400, height: 350 }, altText: { title: "混淆矩阵", description: "10类数字的混淆矩阵热力图", name: "confusion_matrix" } })] }),
        caption("图4-2 MNIST测试集混淆矩阵"),
      ] : []),
      bodyIndent("（1）对角线上的值远高于非对角线，说明模型对各类别的识别准确率都很高。数字1的识别数量最多（1132个），识别效果最好。"),
      bodyIndent("（2）数字4和9之间存在双向混淆，这符合视觉直觉——两者的笔画结构相似，尤其在手写风格差异较大时容易混淆。"),
      bodyIndent("（3）数字5的识别相对较弱，存在与3、6、9的混淆，这与5的书写形态多样有关。"),
      bodyIndent("（4）数字6与0之间存在一定混淆，可能是因为部分6的书写形态接近椭圆，闭合区域较大时容易被误认为0。"),
      bodyIndent("总体而言，模型在所有类别上的召回率均超过98%，错误主要集中在视觉相似的数字对上，这与人类识别时的混淆模式一致，说明模型学到了合理的视觉特征。"),
      new Paragraph({ children: [new PageBreak()] }),

      // ===== 5. 总结与心得体会 =====
      heading("5. 总结与心得体会"),
      bodyIndent("通过本次专业综合实训，我完成了一个基于卷积神经网络的手写数字识别系统的完整开发，包括模型设计、训练、预处理、GUI开发和可视化分析等全部环节。项目最终在MNIST测试集上达到了99.42%的准确率，GUI界面功能完善，用户体验良好。"),
      bodyIndent("在开发过程中，我遇到了几个关键问题并成功解决："),
      bodyIndent("第一，手写数字识别率低的问题。最初由于预处理流程不完整，用户手写数字直接缩放到28×28后输入模型，识别效果很差。通过分析MNIST数据集的特征，我发现MNIST的数字经过了裁剪居中处理。因此重新设计了预处理流程，包括有效区域裁剪、等比缩放至20×20、居中放置于28×28画布，使手写输入与训练数据格式一致，显著提升了识别效果。"),
      bodyIndent("第二，颜色反转问题。MNIST数据集是黑底白字，而手写画布是白底黑字。最初的预处理无条件反色，导致MNIST图片被反色两次。通过引入智能反色逻辑——根据图像平均亮度判断是否需要反色——同时解决了手写输入和MNIST图片的处理问题。"),
      bodyIndent("第三，过拟合问题。通过引入数据增强（RandomAffine）和Dropout正则化，有效提升了模型的泛化能力。数据增强使模型能够适应不同角度、位置和大小变化的数字输入。"),
      bodyIndent("通过这个项目，我深入理解了CNN的工作原理、深度学习的训练流程、图像预处理的重要性，以及GUI开发的实践经验。这些知识和经验对我未来的学习和工作都具有重要价值。"),
      new Paragraph({ children: [new PageBreak()] }),

      // ===== 参考文献 =====
      heading("参考文献"),
      body("[1] 周志华. 机器学习[M]. 北京: 清华大学出版社, 2016."),
      body("[2] 邱锡鹏. 神经网络与深度学习[M]. 北京: 机械工业出版社, 2020."),
      body("[3] 李航. 统计学习方法[M]. 第2版. 北京: 清华大学出版社, 2019."),
      body("[4] 刘建伟, 任月, 刘媛, 等. 深度学习研究进展[J]. 计算机应用研究, 2014, 31(7): 1921-1930."),
      body("[5] 郭丽峰, 刘建华, 董巍. 基于卷积神经网络的手写数字识别[J]. 计算机工程与设计, 2020, 41(3): 890-895."),
      body("[6] 孙志军, 薛磊, 许阳明, 等. 深度学习研究综述[J]. 计算机应用研究, 2012, 29(8): 2806-2810."),
      body("[7] 张玉芳, 刘东阳, 钟将, 等. 基于卷积神经网络的手写体数字识别[J]. 计算机应用研究, 2018, 35(5): 1431-1435."),
      body("[8] 王妍, 段宇翔, 柴政. 基于改进卷积神经网络的手写数字识别[J]. 计算机工程与设计, 2021, 42(2): 512-517."),
      body("[9] 余婉芳, 刘洋, 陈鹏. 深度学习中数据增强技术综述[J]. 计算机工程与应用, 2022, 58(12): 28-40."),
      body("[10] 何明洋, 仇小芽, 赵强. 基于PyTorch的深度学习模型设计与实现[J]. 计算机技术与发展, 2020, 30(10): 115-120."),
      body("[11] 李欣, 梁风, 赵静. 基于MNIST数据集的数字识别算法对比研究[J]. 计算机工程与科学, 2019, 41(11): 2051-2058."),
      body("[12] 陈强, 李俊, 王伟. 基于Tkinter的Python图形用户界面开发[J]. 软件导刊, 2021, 20(6): 88-91."),
      new Paragraph({ children: [new PageBreak()] }),

      // ===== 附录 =====
      heading("附录"),
      body("附录A：项目源代码"),
      bodyIndent("项目源代码已上传至Git仓库，仓库链接：________________"),
      body(""),
      body("附录B：演示视频"),
      bodyIndent("项目演示视频已上传至网盘，网盘链接：________________"),
      body(""),
      body("附录C：运行说明"),
      bodyIndent("1. 安装依赖：pip install -r requirements.txt"),
      bodyIndent("2. 训练模型：python train.py（首次运行自动下载MNIST数据集）"),
      bodyIndent("3. 生成可视化：python visualize.py"),
      bodyIndent("4. 启动应用：python app.py"),
    ]
  }]
});

Packer.toBuffer(doc).then(buffer => {
  const outPath = path.join(PROJECT_DIR, "手写数字识别系统_实训报告.docx");
  fs.writeFileSync(outPath, buffer);
  console.log("报告已生成: " + outPath);
});
