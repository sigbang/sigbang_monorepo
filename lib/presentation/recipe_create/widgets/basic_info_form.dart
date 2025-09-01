import 'package:flutter/material.dart';
import '../../../domain/entities/recipe.dart';

class BasicInfoForm extends StatefulWidget {
  final String title;
  final String description;
  final String ingredients;
  final int cookingTime;
  final RecipeDifficulty difficulty;
  final String linkName;
  final String linkUrl;
  final Map<String, String?> errors;
  final Function(String) onTitleChanged;
  final Function(String) onDescriptionChanged;
  final Function(String) onIngredientsChanged;
  final Function(int) onCookingTimeChanged;
  final Function(RecipeDifficulty) onDifficultyChanged;
  final Function(String) onLinkNameChanged;
  final Function(String) onLinkUrlChanged;
  // Section visibility flags for flexible layouts
  final bool showTitle;
  final bool showDescription;
  final bool showIngredients;
  final bool showCookingTime;
  final bool showDifficulty;
  final bool showLinkFields;
  // When true, applies a brief glow to text inputs only
  final bool pulseInputs;

  const BasicInfoForm({
    super.key,
    required this.title,
    required this.description,
    required this.ingredients,
    required this.cookingTime,
    required this.difficulty,
    this.linkName = '',
    this.linkUrl = '',
    required this.errors,
    required this.onTitleChanged,
    required this.onDescriptionChanged,
    required this.onIngredientsChanged,
    required this.onCookingTimeChanged,
    required this.onDifficultyChanged,
    required this.onLinkNameChanged,
    required this.onLinkUrlChanged,
    this.showTitle = true,
    this.showDescription = true,
    this.showIngredients = true,
    this.showCookingTime = true,
    this.showDifficulty = true,
    this.showLinkFields = false,
    this.pulseInputs = false,
  });

  @override
  State<BasicInfoForm> createState() => _BasicInfoFormState();
}

class _BasicInfoFormState extends State<BasicInfoForm> {
  late TextEditingController _titleController;
  late TextEditingController _descriptionController;
  late TextEditingController _ingredientsController;
  late TextEditingController _linkNameController;
  late TextEditingController _linkUrlController;
  late double _cookingSliderValue;

  @override
  void initState() {
    super.initState();
    _titleController = TextEditingController(text: widget.title);
    _descriptionController = TextEditingController(text: widget.description);
    _ingredientsController = TextEditingController(text: widget.ingredients);
    _linkNameController = TextEditingController(text: widget.linkName);
    _linkUrlController = TextEditingController(text: widget.linkUrl);
    _cookingSliderValue =
        _indexForStops(widget.cookingTime, const [10, 30, 60]).toDouble();
  }

  @override
  void didUpdateWidget(BasicInfoForm oldWidget) {
    super.didUpdateWidget(oldWidget);

    // 외부에서 값이 변경된 경우에만 컨트롤러 업데이트
    if (oldWidget.title != widget.title &&
        _titleController.text != widget.title) {
      _titleController.text = widget.title;
    }
    if (oldWidget.description != widget.description &&
        _descriptionController.text != widget.description) {
      _descriptionController.text = widget.description;
    }
    if (oldWidget.ingredients != widget.ingredients &&
        _ingredientsController.text != widget.ingredients) {
      _ingredientsController.text = widget.ingredients;
    }
    if (oldWidget.linkName != widget.linkName &&
        _linkNameController.text != widget.linkName) {
      _linkNameController.text = widget.linkName;
    }
    if (oldWidget.linkUrl != widget.linkUrl &&
        _linkUrlController.text != widget.linkUrl) {
      _linkUrlController.text = widget.linkUrl;
    }
    if (oldWidget.cookingTime != widget.cookingTime) {
      _cookingSliderValue =
          _indexForStops(widget.cookingTime, const [10, 30, 60]).toDouble();
    }
  }

  @override
  void dispose() {
    _titleController.dispose();
    _descriptionController.dispose();
    _ingredientsController.dispose();
    _linkNameController.dispose();
    _linkUrlController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        if (widget.showTitle) ...[
          _buildTextField(
            context,
            label: '레시피 제목',
            controller: _titleController,
            onChanged: widget.onTitleChanged,
            error: widget.errors['title'],
            isRequired: true,
            maxLength: 100,
            hintText: '제목',
          ),
          const SizedBox(height: 24),
        ],
        if (widget.showDescription) ...[
          _buildTextField(
            context,
            label: '레시피 설명',
            controller: _descriptionController,
            onChanged: widget.onDescriptionChanged,
            error: widget.errors['description'],
            isRequired: false,
            maxLines: 3,
            maxLength: 1000,
            hintText: '레시피에 대한 간단한 설명을 입력하세요',
          ),
          const SizedBox(height: 24),
        ],
        if (widget.showIngredients) ...[
          _buildTextField(
            context,
            label: '재료',
            controller: _ingredientsController,
            onChanged: widget.onIngredientsChanged,
            error: widget.errors['ingredients'],
            isRequired: false,
            maxLines: 5,
            maxLength: 2000,
            hintText: '예:\n- 돼지고기 200g\n- 양파 1개\n- 간장 2큰술\n- 마늘 3쪽',
          ),
          const SizedBox(height: 16),
          _buildSectionDivider(context),
          const SizedBox(height: 16),
        ],
        if (widget.showCookingTime) ...[
          _buildTimeSlider(context),
          const SizedBox(height: 16),
          if (widget.showLinkFields) ...[
            _buildSectionDivider(context),
            const SizedBox(height: 16),
          ],
        ],
        if (widget.showLinkFields) ...[
          _buildTextField(
            context,
            label: '링크 이름',
            controller: _linkNameController,
            onChanged: widget.onLinkNameChanged,
            hintText: '추가 정보가 있다면 링크로 연결해 주세요',
          ),
          const SizedBox(height: 16),
          _buildTextField(
            context,
            label: '링크 주소',
            controller: _linkUrlController,
            onChanged: widget.onLinkUrlChanged,
            hintText: 'https://sigbang.com',
            keyboardType: TextInputType.url,
          ),
          const SizedBox(height: 24),
        ],
        if (widget.showDifficulty) _buildDifficultySelector(context),
      ],
    );
  }

  Widget _buildTextField(
    BuildContext context, {
    required String label,
    required TextEditingController controller,
    required Function(String) onChanged,
    String? error,
    bool isRequired = false,
    int maxLines = 1,
    int? maxLength,
    String? hintText,
    TextInputType? keyboardType,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // 라벨
        Row(
          children: [
            Text(
              label,
              style: Theme.of(context).textTheme.titleMedium?.copyWith(
                    fontWeight: FontWeight.w600,
                  ),
            ),
            if (isRequired) ...[
              const SizedBox(width: 4),
              Text(
                '*',
                style: TextStyle(
                  color: Theme.of(context).colorScheme.error,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ],
          ],
        ),
        const SizedBox(height: 8),

        // 텍스트 필드 (inner fill color + scale animations)
        TweenAnimationBuilder<double>(
          tween: Tween(begin: 1.0, end: widget.pulseInputs ? 1.02 : 1.0),
          duration: const Duration(milliseconds: 220),
          curve: Curves.easeOut,
          builder: (context, scale, _) {
            return Transform.scale(
              alignment: Alignment.centerLeft,
              scale: scale,
              child: TweenAnimationBuilder<Color?>(
                tween: ColorTween(
                  begin: Colors.white,
                  end: widget.pulseInputs ? Colors.amber.shade50 : Colors.white,
                ),
                duration: const Duration(milliseconds: 280),
                curve: Curves.easeOut,
                builder: (context, fill, __) {
                  return TextField(
                    controller: controller,
                    onChanged: onChanged,
                    maxLines: maxLines,
                    maxLength: maxLength,
                    keyboardType: keyboardType,
                    decoration: InputDecoration(
                      hintText: hintText,
                      filled: true,
                      fillColor: fill,
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(24),
                        borderSide: BorderSide(
                          color: Theme.of(context)
                              .colorScheme
                              .outline
                              .withOpacity(0.3),
                        ),
                      ),
                      counterText: '',
                      errorText: error,
                      errorBorder: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(24),
                        borderSide: BorderSide(
                          color: Theme.of(context).colorScheme.error,
                        ),
                      ),
                    ),
                  );
                },
              ),
            );
          },
        ),
      ],
    );
  }

  // 숫자 스텝퍼 UI는 10/30/60 3지점 슬라이더로 구성

  Widget _buildTimeSlider(BuildContext context) {
    final double min = 0;
    final double max = 2;
    final List<int> stops = const [10, 30, 60];

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          '요리시간',
          style: Theme.of(context).textTheme.titleMedium?.copyWith(
                fontWeight: FontWeight.w600,
              ),
        ),
        const SizedBox(height: 8),
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 14),
          child: Row(
            children: const [
              Expanded(
                child: Align(
                  alignment: Alignment.centerLeft,
                  child: Text('10'),
                ),
              ),
              Expanded(
                child: Align(
                  alignment: Alignment.center,
                  child: Text('30'),
                ),
              ),
              Expanded(
                child: Align(
                  alignment: Alignment.centerRight,
                  child: Text('60'),
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 8),
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 14),
          child: SliderTheme(
            data: SliderTheme.of(context).copyWith(
              activeTrackColor: Colors.amber,
              inactiveTrackColor: Colors.amber.withOpacity(0.3),
              thumbColor: Colors.amber,
              valueIndicatorColor: Colors.amber,
              trackHeight: 12,
              trackShape: const RectangularSliderTrackShape(),
              thumbShape: const RoundSliderThumbShape(enabledThumbRadius: 14),
              overlayShape: const RoundSliderOverlayShape(overlayRadius: 0),
            ),
            child: Slider(
              value: _cookingSliderValue,
              min: min,
              max: max,
              divisions: stops.length - 1,
              label: '${stops[_cookingSliderValue.round().toInt()]}분',
              onChanged: (v) {
                setState(() {
                  _cookingSliderValue = v;
                });
              },
              onChangeEnd: (v) {
                final int index = v.round().toInt();
                final int snapped = stops[index];
                setState(() {
                  _cookingSliderValue = index.toDouble();
                });
                widget.onCookingTimeChanged(snapped);
              },
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildSectionDivider(BuildContext context) {
    return Container(
      height: 8,
      width: double.infinity,
      decoration: BoxDecoration(
        color: Colors.grey.shade200,
        borderRadius: BorderRadius.circular(8),
      ),
    );
  }

  int _indexForStops(int value, List<int> stops) {
    int closestIndex = 0;
    int minDiff = (value - stops[0]).abs();
    for (int i = 1; i < stops.length; i++) {
      final d = (value - stops[i]).abs();
      if (d < minDiff) {
        minDiff = d;
        closestIndex = i;
      }
    }
    return closestIndex;
  }

  Widget _buildDifficultySelector(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          '난이도',
          style: Theme.of(context).textTheme.titleMedium?.copyWith(
                fontWeight: FontWeight.w600,
              ),
        ),
        const SizedBox(height: 8),
        Row(
          children: RecipeDifficulty.values.map((diff) {
            final isSelected = widget.difficulty == diff;
            return Expanded(
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 4),
                child: ChoiceChip(
                  label: Text(_getDifficultyText(diff)),
                  selected: isSelected,
                  onSelected: (_) => widget.onDifficultyChanged(diff),
                  selectedColor: Theme.of(context).colorScheme.primaryContainer,
                  backgroundColor:
                      Theme.of(context).colorScheme.surfaceContainerHighest,
                ),
              ),
            );
          }).toList(),
        ),
      ],
    );
  }

  String _getDifficultyText(RecipeDifficulty difficulty) {
    switch (difficulty) {
      case RecipeDifficulty.easy:
        return '쉬움';
      case RecipeDifficulty.medium:
        return '보통';
      case RecipeDifficulty.hard:
        return '어려움';
    }
  }
}
