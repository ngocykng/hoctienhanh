# TÀI LIỆU THIẾT KẾ & ĐẶC TẢ HỆ THỐNG CHUYỂN ĐỔI SANG DESKTOP C# (VISUAL STUDIO)
## ỨNG DỤNG HỌC TỪ VỰNG TIẾNG ANH QUA THẺ FLASHCARD 3D
**Ngôn ngữ mục tiêu:** C# (.NET 8.0 / .NET Framework / WPF)  
**IDE đề xuất:** Visual Studio 2022 (Community / Professional)  
**Phạm vi (Scope):** Chỉ tập trung học **Tiếng Anh - Tiếng Việt** qua cơ chế **Thẻ Flashcard 3D** tương tác cao trên PC.

---

## MỤC LỤC
1. [Phạm vi & Mục tiêu Dự án (Scope & Objectives)](#1-phạm-vi--mục-tiêu-dự-án)
2. [Ngăn xếp Công nghệ Đề xuất (Technology Stack)](#2-ngăn-xếp-công-nghệ-đề-xuất)
3. [Cấu trúc Thư mục Dự án C# trên Visual Studio](#3-cấu-trúc-thư-mục-dự-án-c-trên-visual-studio)
4. [Mô hình Dữ liệu (Data Models & C# POCO Classes)](#4-mô-hình-dữ-liệu-data-models)
5. [Kiến trúc Phần mềm MVVM (Model - View - ViewModel)](#5-kiến-trúc-phần-mềm-mvvm)
6. [Thiết kế & Mã nguồn Xử lý Thẻ Flashcard 3D trong WPF](#6-thiết-kế--mã-nguồn-xử-lý-thẻ-flashcard-3d)
7. [Tích hợp Phát âm Giọng đọc Tiếng Anh (Native TTS)](#7-tích-hợp-phát-âm-giọng-đọc-tiếng-anh)
8. [Cơ chế Lưu trữ Dữ liệu Offline & Quản lý Tiến độ](#8-cơ-chế-lưu-trữ-dữ-liệu-offline)
9. [Hệ thống Phím tắt Tối ưu Trải nghiệm Desktop (Shortcuts)](#9-hệ-thống-phím-tắt-desktop)
10. [Hướng dẫn Biên dịch & Đóng gói (.EXE Single File)](#10-hướng-dẫn-biên-dịch--đóng-gói)

---

## 1. PHẠM VI & MỤC TIÊU DỰ ÁN

### 1.1. Phạm vi thu gọn (Reduced Scope)
- **Ngôn ngữ học:** Chuyên biệt cho **Tiếng Anh** (từ vựng, phiên âm chuẩn IPA, phân loại từ vựng, định nghĩa tiếng Việt, câu ví dụ tiếng Anh có dịch nghĩa).
- **Phương pháp học độc quyền:** Chỉ tập trung vào trải nghiệm **Thẻ Flashcard không gian 3D (3D Interactive Flip Card)**.
- **Loại bỏ khỏi phạm vi:** 
  - Không bao gồm các ngôn ngữ khác (Tiếng Trung, Tiếng Nhật).
  - Không tích hợp trình phát YouTube hay đồng bộ phụ đề phức tạp.
  - Không yêu cầu kết nối Server / Cloud bắt buộc, hoạt động hoàn toàn **Offline 100%** trên máy tính cá nhân.

### 1.2. Mục tiêu kỹ thuật
- **Hiệu năng cao:** Khởi động tức thì (< 1 giây), tiêu thụ ít RAM (< 60MB).
- **Trực quan sinh động:** Thẻ xoay lật 3D 180 độ có chiều sâu (Perspective Depth), hiệu ứng đổ bóng mượt mà 60 FPS bằng Direct3D phần cứng.
- **Tiện dụng trên PC:** Tận dụng tối đa chuột và bàn phím (Spacebar để lật thẻ, mũi tên điều hướng, số 1-4 để chấm điểm nhớ từ).

---

## 2. NGÂN XẾP CÔNG NGHỆ ĐỀ XUẤT

| Thành phần | Công nghệ lựa chọn | Lý do lựa chọn |
| :--- | :--- | :--- |
| **Nền tảng (Platform)** | **C# (.NET 8.0)** | Phiên bản LTS mới nhất, hiệu năng cao, tối ưu biên dịch Native AOT hoặc Single-file .exe. |
| **Giao diện (UI Framework)** | **WPF (Windows Presentation Foundation)** | Hỗ trợ đồ họa vector, Animation phần cứng (GPU Accelerated) và cơ chế xoay không gian `Viewport3D` / `PlaneProjection` mượt mà nhất trên Windows. |
| **Mẫu kiến trúc (Pattern)** | **MVVM (Model - View - ViewModel)** | Chuẩn công nghiệp của WPF, phân tách rõ ràng giữa giao diện XAML và logic C#. |
| **Âm thanh (TTS)** | **System.Speech.Synthesis** | API có sẵn của Windows, phát âm tiếng Anh tự nhiên (Microsoft David/Zira), không cần cài thêm thư viện ngoài. |
| **Lưu trữ dữ liệu (Storage)** | **System.Text.Json / SQLite** | Lưu trữ danh sách thẻ dạng JSON hoặc cơ sở dữ liệu SQLite siêu nhẹ, dễ dàng import/export. |
| **Icon & UI Styling** | **MaterialDesignThemes.Wpf** | Thư viện giao diện Material Design hiện đại, bo góc mềm mại, đổ bóng chân thực. |

---

## 3. CẤU TRÚC THƯ MỤC DỰ ÁN C# TRÊN VISUAL STUDIO

```text
EnglishFlashcard3D/
│
├── App.xaml                      # Khai báo tài nguyên toàn cục (Brushes, Styles, Themes)
├── App.xaml.cs                   # Điểm khởi chạy ứng dụng (Entry point logic)
│
├── Models/                       # Định nghĩa dữ liệu (POCO)
│   ├── EnglishFlashcard.cs       # Model thẻ từ vựng tiếng Anh
│   ├── TopicDeck.cs              # Model bộ thẻ theo chủ đề
│   └── UserStudyProgress.cs      # Tiến độ học và lịch sử ôn tập
│
├── ViewModels/                   # Logic giao diện & Data Binding
│   ├── BaseViewModel.cs          # Kế thừa INotifyPropertyChanged
│   ├── MainViewModel.cs          # Quản lý danh sách bộ thẻ và điều hướng
│   └── Flashcard3DViewModel.cs   # Logic lật thẻ 3D, next/prev, chấm điểm
│
├── Views/                        # Giao diện XAML
│   ├── MainWindow.xaml           # Cửa sổ chính của ứng dụng
│   ├── MainWindow.xaml.cs        # Code-behind của MainWindow
│   └── Controls/
│       ├── Card3DView.xaml       # UserControl chứa hiệu ứng xoay lật 3D
│       └── Card3DView.xaml.cs    # Điều khiển Storyboard xoay thẻ
│
├── Services/                     # Tầng dịch vụ hệ thống
│   ├── AudioService.cs           # Dịch vụ phát âm từ vựng (TTS)
│   ├── DataStorageService.cs     # Đọc/ghi dữ liệu thẻ từ file JSON
│   └── SpacedRepetitionService.cs# Thuật toán lặp lại ngắt quãng (SM-2 tối giản)
│
├── Assets/                       # Dữ liệu tĩnh và tài nguyên
│   ├── Data/
│   │   └── default_cards.json    # Kho từ vựng tiếng Anh mẫu (A1 - C2, IELTS)
│   └── Images/
│       └── app_icon.ico          # Icon ứng dụng Desktop
│
└── EnglishFlashcard3D.csproj     # File cấu hình dự án .NET
```

---

## 4. MÔ HÌNH DỮ LIỆU (DATA MODELS)

### 4.1. Model Thẻ Từ vựng (`EnglishFlashcard.cs`)
```csharp
using System;

namespace EnglishFlashcard3D.Models
{
    public class EnglishFlashcard
    {
        public string Id { get; set; } = Guid.NewGuid().ToString();
        
        // Mặt trước (Front side)
        public string Word { get; set; } = string.Empty;           // Ví dụ: "Resilience"
        public string Phonetic { get; set; } = string.Empty;       // Ví dụ: "/rɪˈzɪl.jəns/"
        public string PartOfSpeech { get; set; } = string.Empty;   // Noun, Verb, Adjective
        
        // Mặt sau (Back side)
        public string MeaningVi { get; set; } = string.Empty;      // Ví dụ: "Khả năng phục hồi, kiên cường"
        public string ExampleEn { get; set; } = string.Empty;      // Ví dụ: "She showed great resilience in the face of adversity."
        public string ExampleVi { get; set; } = string.Empty;      // Dịch nghĩa câu ví dụ
        public string Note { get; set; } = string.Empty;           // Ghi chú ngữ cảnh, từ đồng nghĩa
        
        // Trạng thái học tập
        public int ReviewCount { get; set; } = 0;                  // Số lần đã ôn
        public bool IsMastered { get; set; } = false;              // Đã thuộc hay chưa
        public DateTime? LastReviewedAt { get; set; }              // Thời gian ôn gần nhất
    }
}
```

### 4.2. Model Bộ Thẻ Theo Chủ Đề (`TopicDeck.cs`)
```csharp
using System.Collections.Generic;

namespace EnglishFlashcard3D.Models
{
    public class TopicDeck
    {
        public string Id { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;           // Ví dụ: "Oxford 3000 - Essential Words"
        public string Description { get; set; } = string.Empty;
        public string Level { get; set; } = "B1";                  // A1, A2, B1, B2, C1, IELTS
        public List<EnglishFlashcard> Cards { get; set; } = new List<EnglishFlashcard>();
    }
}
```

---

## 5. KIẾN TRÚC PHẦN MỀM MVVM

### 5.1. `BaseViewModel.cs` (Hỗ trợ Data Binding)
```csharp
using System.ComponentModel;
using System.Runtime.CompilerServices;

namespace EnglishFlashcard3D.ViewModels
{
    public abstract class BaseViewModel : INotifyPropertyChanged
    {
        public event PropertyChangedEventHandler? PropertyChanged;

        protected void OnPropertyChanged([CallerMemberName] string? propertyName = null)
        {
            PropertyChanged?.Invoke(this, new PropertyChangedEventArgs(propertyName));
        }

        protected bool SetField<T>(ref T field, T value, [CallerMemberName] string? propertyName = null)
        {
            if (EqualityComparer<T>.Default.Equals(field, value)) return false;
            field = value;
            OnPropertyChanged(propertyName);
            return true;
        }
    }
}
```

### 5.2. `Flashcard3DViewModel.cs` (Xử lý Logic Học Thẻ)
```csharp
using System.Collections.ObjectModel;
using System.Windows.Input;
using EnglishFlashcard3D.Models;
using EnglishFlashcard3D.Services;

namespace EnglishFlashcard3D.ViewModels
{
    public class Flashcard3DViewModel : BaseViewModel
    {
        private readonly AudioService _audioService;
        private ObservableCollection<EnglishFlashcard> _cards;
        private int _currentIndex = 0;
        private bool _isFlipped = false;

        public Flashcard3DViewModel(List<EnglishFlashcard> cards)
        {
            _audioService = new AudioService();
            _cards = new ObservableCollection<EnglishFlashcard>(cards);
            
            FlipCommand = new RelayCommand(_ => FlipCard());
            NextCommand = new RelayCommand(_ => NextCard(), _ => CanNext);
            PrevCommand = new RelayCommand(_ => PrevCard(), _ => CanPrev);
            PronounceCommand = new RelayCommand(_ => SpeakCurrentWord());
            MarkMasteredCommand = new RelayCommand(_ => MarkMastered());
        }

        public EnglishFlashcard? CurrentCard => 
            (_cards.Count > 0 && _currentIndex >= 0 && _currentIndex < _cards.Count) 
            ? _cards[_currentIndex] : null;

        public int CurrentIndex
        {
            get => _currentIndex;
            set
            {
                if (SetField(ref _currentIndex, value))
                {
                    OnPropertyChanged(nameof(CurrentCard));
                    OnPropertyChanged(nameof(ProgressText));
                    IsFlipped = false; // Reset về mặt trước khi đổi thẻ
                }
            }
        }

        public bool IsFlipped
        {
            get => _isFlipped;
            set => SetField(ref _isFlipped, value);
        }

        public string ProgressText => $"{_currentIndex + 1} / {_cards.Count}";

        public bool CanNext => _currentIndex < _cards.Count - 1;
        public bool CanPrev => _currentIndex > 0;

        public ICommand FlipCommand { get; }
        public ICommand NextCommand { get; }
        public ICommand PrevCommand { get; }
        public ICommand PronounceCommand { get; }
        public ICommand MarkMasteredCommand { get; }

        public void FlipCard() => IsFlipped = !IsFlipped;

        public void NextCard()
        {
            if (CanNext) CurrentIndex++;
        }

        public void PrevCard()
        {
            if (CanPrev) CurrentIndex--;
        }

        public void SpeakCurrentWord()
        {
            if (CurrentCard != null && !string.IsNullOrWhiteSpace(CurrentCard.Word))
            {
                _audioService.SpeakAsync(CurrentCard.Word);
            }
        }

        public void MarkMastered()
        {
            if (CurrentCard != null)
            {
                CurrentCard.IsMastered = true;
                NextCard();
            }
        }
    }
}
```

---

## 6. THIẾT KẾ & MÃ NGUỒN XỬ LÝ THẺ FLASHCARD 3D

Để tạo cảm giác lật thẻ 3D chân thực nhất trên Windows Desktop, chúng ta sử dụng `Viewport2DVisual3D` hoặc cơ chế phép biến đổi 3D `DoubleAnimation` xoay quanh trục Y (`AxisAngleRotation3D`).

### 6.1. XAML Giao diện Thẻ 3D (`Card3DView.xaml`)
```xml
<UserControl x:Class="EnglishFlashcard3D.Views.Controls.Card3DView"
             xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
             xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
             xmlns:mc="http://schemas.openxmlformats.org/markup-compatibility/2006" 
             xmlns:d="http://schemas.microsoft.com/expression/blend/2008" 
             mc:Ignorable="d" 
             d:DesignHeight="420" d:DesignWidth="650">

    <UserControl.Resources>
        <!-- Storyboard Xoay thẻ sang mặt sau (0 -> 180 độ) -->
        <Storyboard x:Key="FlipToBackStoryboard">
            <DoubleAnimation Storyboard.TargetName="CardRotation"
                             Storyboard.TargetProperty="Angle"
                             To="180" Duration="0:0:0.4">
                <DoubleAnimation.EasingFunction>
                    <CubicEase EasingMode="EaseOut"/>
                </DoubleAnimation.EasingFunction>
            </DoubleAnimation>
        </Storyboard>

        <!-- Storyboard Xoay thẻ về mặt trước (180 -> 0 độ) -->
        <Storyboard x:Key="FlipToFrontStoryboard">
            <DoubleAnimation Storyboard.TargetName="CardRotation"
                             Storyboard.TargetProperty="Angle"
                             To="0" Duration="0:0:0.4">
                <DoubleAnimation.EasingFunction>
                    <CubicEase EasingMode="EaseOut"/>
                </DoubleAnimation.EasingFunction>
            </DoubleAnimation>
        </Storyboard>
    </UserControl.Resources>

    <Grid>
        <!-- Không gian 3D Viewport -->
        <Viewport3D>
            <!-- Camera góc nhìn phối cảnh (Perspective Depth) -->
            <Viewport3D.Camera>
                <PerspectiveCamera Position="0,0,6" LookDirection="0,0,-1" FieldOfView="45"/>
            </Viewport3D.Camera>

            <!-- Ánh sáng môi trường và chiếu sáng hướng -->
            <ModelVisual3D>
                <ModelVisual3D.Content>
                    <Model3DGroup>
                        <AmbientLight Color="#FFE0E0E0"/>
                        <DirectionalLight Color="#FFFFFF" Direction="0.2,-0.3,-1"/>
                    </Model3DGroup>
                </ModelVisual3D.Content>
            </ModelVisual3D>

            <!-- Đối tượng Thẻ 3D chứa 2 mặt -->
            <ContainerUIElement3D>
                <ContainerUIElement3D.Transform>
                    <RotateTransform3D>
                        <RotateTransform3D.Rotation>
                            <AxisAngleRotation3D x:Name="CardRotation" Axis="0,1,0" Angle="0"/>
                        </RotateTransform3D.Rotation>
                    </RotateTransform3D>
                </ContainerUIElement3D.Transform>

                <!-- MẶT TRƯỚC CỦA THẺ (FRONT SIDE) -->
                <Viewport2DVisual3D>
                    <Viewport2DVisual3D.Geometry>
                        <MeshGeometry3D Positions="-2,1.3,0  2,1.3,0  2,-1.3,0  -2,-1.3,0"
                                        TriangleIndices="0 1 2  0 2 3"
                                        TextureCoordinates="0,0  1,0  1,1  0,1"/>
                    </Viewport2DVisual3D.Geometry>
                    <Viewport2DVisual3D.Material>
                        <DiffuseMaterial Brush="White"/>
                    </Viewport2DVisual3D.Material>

                    <!-- Nội dung UI Mặt trước -->
                    <Border Background="#1E293B" CornerRadius="16" BorderBrush="#38BDF8" BorderThickness="2"
                            Width="520" Height="340" Cursor="Hand" MouseLeftButtonUp="OnCardClicked">
                        <Border.Effect>
                            <DropShadowEffect BlurRadius="25" ShadowDepth="8" Color="#000000" Opacity="0.4"/>
                        </Border.Effect>

                        <Grid Margin="30">
                            <!-- Tag loại từ -->
                            <Border HorizontalAlignment="Right" VerticalAlignment="Top" 
                                    Background="#0369A1" CornerRadius="6" Padding="10,4">
                                <TextBlock Text="{Binding CurrentCard.PartOfSpeech}" Foreground="White" FontWeight="Bold" FontSize="13"/>
                            </Border>

                            <StackPanel VerticalAlignment="Center" HorizontalAlignment="Center">
                                <!-- Từ Tiếng Anh chính -->
                                <TextBlock Text="{Binding CurrentCard.Word}" 
                                           Foreground="#F8FAFC" FontSize="42" FontWeight="ExtraBold" 
                                           HorizontalAlignment="Center" Margin="0,0,0,10"/>
                                
                                <!-- Phiên âm IPA -->
                                <TextBlock Text="{Binding CurrentCard.Phonetic}" 
                                           Foreground="#38BDF8" FontSize="20" FontStyle="Italic"
                                           HorizontalAlignment="Center" Margin="0,0,0,20"/>

                                <!-- Nút Nghe phát âm -->
                                <Button Command="{Binding PronounceCommand}" 
                                        Background="#0284C7" Foreground="White" 
                                        Padding="16,8" BorderThickness="0" Cursor="Hand">
                                    <StackPanel Orientation="Horizontal">
                                        <TextBlock Text="🔊 Nghe phát âm (P)" FontWeight="SemiBold"/>
                                    </StackPanel>
                                </Button>
                            </StackPanel>

                            <TextBlock Text="Nhấp chuột hoặc ấn [Space] để lật mặt sau ↻" 
                                       Foreground="#64748B" FontSize="13" 
                                       HorizontalAlignment="Center" VerticalAlignment="Bottom"/>
                        </Grid>
                    </Border>
                </Viewport2DVisual3D>

                <!-- MẶT SAU CỦA THẺ (BACK SIDE - Xoay 180 độ đối xứng) -->
                <Viewport2DVisual3D>
                    <Viewport2DVisual3D.Geometry>
                        <MeshGeometry3D Positions="2,1.3,0  -2,1.3,0  -2,-1.3,0  2,-1.3,0"
                                        TriangleIndices="0 1 2  0 2 3"
                                        TextureCoordinates="0,0  1,0  1,1  0,1"/>
                    </Viewport2DVisual3D.Geometry>
                    <Viewport2DVisual3D.Material>
                        <DiffuseMaterial Brush="White"/>
                    </Viewport2DVisual3D.Material>

                    <!-- Nội dung UI Mặt sau -->
                    <Border Background="#0F172A" CornerRadius="16" BorderBrush="#10B981" BorderThickness="2"
                            Width="520" Height="340" Cursor="Hand" MouseLeftButtonUp="OnCardClicked">
                        <Grid Margin="30">
                            <StackPanel VerticalAlignment="Center">
                                <!-- Nghĩa tiếng Việt -->
                                <TextBlock Text="Định nghĩa:" Foreground="#94A3B8" FontSize="13" FontWeight="Bold"/>
                                <TextBlock Text="{Binding CurrentCard.MeaningVi}" 
                                           Foreground="#34D399" FontSize="26" FontWeight="Bold" 
                                           TextWrapping="Wrap" Margin="0,4,0,20"/>

                                <!-- Ví dụ Tiếng Anh -->
                                <TextBlock Text="Câu ví dụ thực tế:" Foreground="#94A3B8" FontSize="13" FontWeight="Bold"/>
                                <TextBlock Text="{Binding CurrentCard.ExampleEn}" 
                                           Foreground="#F1F5F9" FontSize="17" FontStyle="Italic" 
                                           TextWrapping="Wrap" Margin="0,4,0,6"/>

                                <!-- Dịch nghĩa ví dụ -->
                                <TextBlock Text="{Binding CurrentCard.ExampleVi}" 
                                           Foreground="#64748B" FontSize="15" 
                                           TextWrapping="Wrap"/>
                            </StackPanel>

                            <TextBlock Text="Nhấp chuột hoặc ấn [Space] để quay lại ↺" 
                                       Foreground="#475569" FontSize="13" 
                                       HorizontalAlignment="Center" VerticalAlignment="Bottom"/>
                        </Grid>
                    </Border>
                </Viewport2DVisual3D>
            </ContainerUIElement3D>
        </Viewport3D>
    </Grid>
</UserControl>
```

### 6.2. Code-behind Kích hoạt Hiệu ứng (`Card3DView.xaml.cs`)
```csharp
using System.Windows.Controls;
using System.Windows.Input;
using System.Windows.Media.Animation;
using EnglishFlashcard3D.ViewModels;

namespace EnglishFlashcard3D.Views.Controls
{
    public partial class Card3DView : UserControl
    {
        public Card3DView()
        {
            InitializeComponent();
            DataContextChanged += (s, e) =>
            {
                if (DataContext is Flashcard3DViewModel vm)
                {
                    vm.PropertyChanged += (sender, args) =>
                    {
                        if (args.PropertyName == nameof(Flashcard3DViewModel.IsFlipped))
                        {
                            AnimateFlip(vm.IsFlipped);
                        }
                    };
                }
            };
        }

        private void OnCardClicked(object sender, MouseButtonEventArgs e)
        {
            if (DataContext is Flashcard3DViewModel vm)
            {
                vm.FlipCard();
            }
        }

        private void AnimateFlip(bool isFlipped)
        {
            var storyboardName = isFlipped ? "FlipToBackStoryboard" : "FlipToFrontStoryboard";
            if (FindResource(storyboardName) is Storyboard sb)
            {
                sb.Begin();
            }
        }
    }
}
```

---

## 7. TÍCH HỢP PHÁT ÂM GIỌNG ĐỌC TIẾNG ANH (NATIVE TTS)

Không cần kết nối internet hay trả phí API bên ngoài, ứng dụng tận dụng engine giọng đọc tự nhiên có sẵn trong hệ điều hành Windows thông qua `System.Speech.Synthesis`:

```csharp
using System;
using System.Linq;
using System.Speech.Synthesis;

namespace EnglishFlashcard3D.Services
{
    public class AudioService : IDisposable
    {
        private readonly SpeechSynthesizer _synthesizer;

        public AudioService()
        {
            _synthesizer = new SpeechSynthesizer();
            
            // Ưu tiên chọn giọng tiếng Anh chuẩn (US/UK: Microsoft Zira, David hoặc Mark)
            var englishVoice = _synthesizer.GetInstalledVoices()
                .FirstOrDefault(v => v.Enabled && v.VoiceInfo.Culture.Name.StartsWith("en-"));

            if (englishVoice != null)
            {
                _synthesizer.SelectVoice(englishVoice.VoiceInfo.Name);
            }

            _synthesizer.Rate = 0;   // Tốc độ bình thường (-10 đến +10)
            _synthesizer.Volume = 100; // Âm lượng tối đa (0 - 100)
        }

        public void SpeakAsync(string text)
        {
            try
            {
                _synthesizer.SpeakAsyncCancelAll(); // Ngắt âm đang phát dở
                _synthesizer.SpeakAsync(text);
            }
            catch (Exception ex)
            {
                System.Diagnostics.Debug.WriteLine($"TTS Error: {ex.Message}");
            }
        }

        public void Dispose()
        {
            _synthesizer?.Dispose();
        }
    }
}
```

---

## 8. CƠ CHẾ LƯU TRỮ DỮ LIỆU OFFLINE

Dữ liệu thẻ từ vựng được lưu trữ dưới dạng file JSON chuẩn hóa đặt tại thư mục cài đặt hoặc `AppData`:

### 8.1. File Dữ liệu Mẫu (`Assets/Data/default_cards.json`)
```json
[
  {
    "Id": "card-001",
    "Word": "Accomplish",
    "Phonetic": "/əˈkʌm.plɪʃ/",
    "PartOfSpeech": "Verb",
    "MeaningVi": "Hoàn thành, đạt được (mục tiêu)",
    "ExampleEn": "If we work together, we can accomplish anything.",
    "ExampleVi": "Nếu chúng ta làm việc cùng nhau, chúng ta có thể đạt được bất cứ điều gì.",
    "IsMastered": false,
    "ReviewCount": 0
  },
  {
    "Id": "card-002",
    "Word": "Perseverance",
    "Phonetic": "/ˌpɜː.sɪˈvɪə.rəns/",
    "PartOfSpeech": "Noun",
    "MeaningVi": "Sự kiên trì, lòng nhẫn nại vượt qua khó khăn",
    "ExampleEn": "Through hard work and perseverance, he reached his dream.",
    "ExampleVi": "Bằng sự chăm chỉ và lòng kiên trì, anh ấy đã chạm tới ước mơ của mình.",
    "IsMastered": false,
    "ReviewCount": 0
  }
]
```

### 8.2. Service Đọc/Ghi Dữ Liệu (`DataStorageService.cs`)
```csharp
using System.IO;
using System.Text.Json;
using EnglishFlashcard3D.Models;

namespace EnglishFlashcard3D.Services
{
    public class DataStorageService
    {
        private readonly string _filePath;

        public DataStorageService(string fileName = "cards.json")
        {
            var folder = Path.Combine(
                Environment.GetFolderPath(Environment.SpecialFolder.ApplicationData), 
                "EnglishFlashcard3D");
            
            if (!Directory.Exists(folder))
            {
                Directory.CreateDirectory(folder);
            }

            _filePath = Path.Combine(folder, fileName);
        }

        public async Task<List<EnglishFlashcard>> LoadCardsAsync()
        {
            if (!File.Exists(_filePath))
            {
                // Nạp dữ liệu mẫu ban đầu nếu file chưa tồn tại
                return GetDefaultSampleCards();
            }

            var json = await File.ReadAllTextAsync(_filePath);
            return JsonSerializer.Deserialize<List<EnglishFlashcard>>(json) ?? new List<EnglishFlashcard>();
        }

        public async Task SaveCardsAsync(List<EnglishFlashcard> cards)
        {
            var options = new JsonSerializerOptions { WriteIndented = true };
            var json = JsonSerializer.Serialize(cards, options);
            await File.WriteAllTextAsync(_filePath, json);
        }

        private List<EnglishFlashcard> GetDefaultSampleCards()
        {
            // Trả về danh sách nạp sẵn (Seed data)
            return new List<EnglishFlashcard>
            {
                new EnglishFlashcard
                {
                    Word = "Eloquent",
                    Phonetic = "/ˈel.ə.kwənt/",
                    PartOfSpeech = "Adjective",
                    MeaningVi = "Hùng biện, lưu loát, truyền cảm",
                    ExampleEn = "An eloquent speech moved everyone in the audience.",
                    ExampleVi = "Bài phát biểu hùng biện đã làm lay động tất cả khán giả."
                }
            };
        }
    }
}
```

---

## 9. HỆ THỐNG PHÍM TẮT TỐI ƯU TRẢI NGHIỆM DESKTOP

Để mang lại trải nghiệm học tập tập trung cao độ trên máy tính để bàn (Desktop Ergonomics), toàn bộ thao tác được gán vào các phím bấm tiện lợi:

| Phím tắt | Thao tác tương ứng | Mô tả chức năng |
| :--- | :--- | :--- |
| **Phím Space (Phím cách)** | **Lật Thẻ 3D** | Kích hoạt xoay thẻ 180 độ giữa mặt trước và mặt sau. |
| **Mũi tên Phải (→)** | **Thẻ tiếp theo** | Chuyển sang thẻ từ vựng kế tiếp (`Next Card`). |
| **Mũi tên Trái (←)** | **Thẻ trước đó** | Quay lại thẻ từ vựng trước (`Previous Card`). |
| **Phím P** | **Phát âm từ vựng** | Kích hoạt đọc từ tiếng Anh bằng giọng bản xứ. |
| **Phím M hoặc Enter** | **Đánh dấu đã thuộc** | Đánh dấu `Mastered` và tự động chuyển sang thẻ mới. |
| **Phím Esc** | **Về màn hình chính** | Thoát chế độ học tập thẻ 3D về menu lựa chọn. |

### Cài đặt Lắng nghe Phím trong `MainWindow.xaml.cs`:
```csharp
private void Window_KeyDown(object sender, KeyEventArgs e)
{
    if (DataContext is MainViewModel mainVm && mainVm.CurrentViewModel is Flashcard3DViewModel vm)
    {
        switch (e.Key)
        {
            case Key.Space:
                vm.FlipCard();
                e.Handled = true;
                break;
            case Key.Right:
                vm.NextCard();
                e.Handled = true;
                break;
            case Key.Left:
                vm.PrevCard();
                e.Handled = true;
                break;
            case Key.P:
                vm.SpeakCurrentWord();
                e.Handled = true;
                break;
            case Key.M:
            case Key.Enter:
                vm.MarkMastered();
                e.Handled = true;
                break;
        }
    }
}
```

---

## 10. HƯỚNG DẪN BIÊN DỊCH & ĐÓNG GÓI (.EXE SINGLE FILE)

### 10.1. Tạo dự án trên Visual Studio 2022
1. Mở Visual Studio 2022 -> Chọn **Create a new project**.
2. Tìm kiếm và chọn mẫu: **WPF Application** (C#, .NET).
3. Đặt tên: `EnglishFlashcard3D` -> Chọn Target Framework: **.NET 8.0 (Long Term Support)**.
4. Nhấp **Create**.

### 10.2. Xuất file chạy duy nhất (Single-file Executable)
Để người dùng tải về mở lên là dùng ngay mà không cần cài thêm .NET Runtime:
1. Nhấp chuột phải vào dự án `EnglishFlashcard3D` trong Solution Explorer -> Chọn **Publish**.
2. Chọn Target: **Folder** -> Next -> Chọn thư mục xuất file -> Finish.
3. Trong màn hình cấu hình Publish, chọn biểu tượng cây bút chỉnh sửa:
   - **Deployment mode:** `Self-contained` (Tự nhúng .NET runtime vào file).
   - **Target runtime:** `win-x64` (Dành cho Windows 10/11 64-bit).
   - **File publish options:**
     - Đánh dấu tick: `Produce single file` (Đóng gói tất cả DLL vào 1 file .exe duy nhất).
     - Đánh dấu tick: `Enable ReadyToRun compilation` (Tăng tốc độ khởi động tức thì).
4. Nhấn **Publish**. Kết quả tạo ra một file `EnglishFlashcard3D.exe` duy nhất (~60MB đã kèm trọn gói runtime) sẵn sàng chia sẻ cho người học.

---

## TỔNG KẾT
Tài liệu trên cung cấp kiến trúc và mã nguồn đầy đủ để chuyển đổi tính năng học thẻ Flashcard sang ứng dụng Desktop chuyên biệt bằng **C# / WPF trên Visual Studio**. Ứng dụng đáp ứng trọn vẹn:
- Trọng tâm học **Tiếng Anh**.
- Trải nghiệm **3D Flashcard** mượt mà với phần cứng máy tính.
- Hoạt động **Offline 100%**, có âm thanh bản xứ và hỗ trợ phím tắt tối ưu.
