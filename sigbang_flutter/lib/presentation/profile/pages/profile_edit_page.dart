import 'dart:io';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:get_it/get_it.dart';
import '../../session/session_cubit.dart';
import '../cubits/profile_edit_cubit.dart';
import '../cubits/profile_edit_state.dart';

class ProfileEditPage extends StatelessWidget {
  const ProfileEditPage({super.key});

  @override
  Widget build(BuildContext context) {
    final session = GetIt.I<SessionCubit>().state;
    final user = session.user;
    if (user == null) {
      return const Scaffold(body: Center(child: Text('로그인이 필요합니다')));
    }

    return BlocProvider(
      create: (_) => GetIt.I<ProfileEditCubit>()..init(user),
      child: const _ProfileEditView(),
    );
  }
}

class _ProfileEditView extends StatefulWidget {
  const _ProfileEditView();

  @override
  State<_ProfileEditView> createState() => _ProfileEditViewState();
}

// Stateful container to hold a persistent TextEditingController for IME safety.
class _ProfileEditViewState extends State<_ProfileEditView> {
  late final TextEditingController _controller;

  @override
  void initState() {
    super.initState();
    final initial = context.read<ProfileEditCubit>().state.name;
    _controller = TextEditingController(text: initial);
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return BlocConsumer<ProfileEditCubit, ProfileEditState>(
      listener: (context, state) {
        // Keep controller in sync when state updates (avoid disrupting IME composing)
        if (_controller.text != state.name &&
            !_controller.value.isComposingRangeValid) {
          _controller.value = TextEditingValue(
            text: state.name,
            selection: TextSelection.collapsed(offset: state.name.length),
          );
        }
        if (!state.isSaving && state.error == null && !state.isDirty) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('프로필이 저장되었습니다')),
          );
          Navigator.of(context).pop(); // 돌아가기
        } else if (state.error != null) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text(state.error!)),
          );
        }
      },
      builder: (context, state) {
        final avatar = state.avatarPreviewPath != null
            ? CircleAvatar(
                radius: 44,
                backgroundImage: FileImage(File(state.avatarPreviewPath!)),
              )
            : CircleAvatar(
                radius: 44,
                backgroundImage: state.originalAvatarUrl != null
                    ? NetworkImage(state.originalAvatarUrl!)
                    : null,
                child: state.originalAvatarUrl == null
                    ? const Icon(Icons.person, size: 36)
                    : null,
              );

        return Scaffold(
          appBar: AppBar(
            title: const Text('프로필 수정'),
            actions: [
              TextButton(
                onPressed: (!state.isDirty || state.isSaving)
                    ? null
                    : () => context.read<ProfileEditCubit>().save(),
                child: const Text('저장'),
              ),
            ],
          ),
          body: Stack(
            children: [
              ListView(
                padding: const EdgeInsets.all(16),
                children: [
                  Center(
                    child: InkWell(
                      onTap: state.isSaving
                          ? null
                          : () => _showImageOptions(context),
                      child: Stack(
                        alignment: Alignment.bottomRight,
                        children: [
                          avatar,
                          Container(
                            decoration: BoxDecoration(
                              color: Theme.of(context).colorScheme.primary,
                              shape: BoxShape.circle,
                            ),
                            padding: const EdgeInsets.all(6),
                            child: const Icon(Icons.edit,
                                size: 16, color: Colors.white),
                          ),
                        ],
                      ),
                    ),
                  ),
                  const SizedBox(height: 24),
                  TextField(
                    controller: _controller,
                    enabled: !state.isSaving,
                    decoration: const InputDecoration(
                      labelText: '닉네임',
                      hintText: '2~20자',
                    ),
                    onChanged: (v) =>
                        context.read<ProfileEditCubit>().setName(v),
                  ),
                  if (state.error != null) ...[
                    const SizedBox(height: 8),
                    Text(
                      state.error!,
                      style: TextStyle(
                          color: Theme.of(context).colorScheme.error),
                    ),
                  ],
                ],
              ),
              // Optional loading overlay for presets fetch
              if (state.isLoadingPresets)
                Container(
                  color: Colors.transparent,
                  alignment: Alignment.topCenter,
                  padding: const EdgeInsets.only(top: 8),
                  child: const LinearProgressIndicator(minHeight: 2),
                ),
              if (state.isSaving)
                Container(
                  color: Colors.black26,
                  child:
                      const Center(child: CircularProgressIndicator()),
                ),
            ],
          ),
        );
      },
    );
  }

  void _showImageOptions(BuildContext context) {
    showModalBottomSheet<void>(
      context: context,
      showDragHandle: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(16)),
      ),
      builder: (ctx) {
        return SafeArea(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              ListTile(
                leading: const Icon(Icons.photo_library_outlined),
                title: const Text('사진에서 선택'),
                onTap: () {
                  Navigator.of(ctx).pop();
                  context.read<ProfileEditCubit>().pickAvatar(context);
                },
              ),
              ListTile(
                leading: Icon(Icons.grid_view_outlined,
                    color: Theme.of(context).disabledColor),
                title: Text('프리셋에서 선택 (준비중)',
                    style: TextStyle(color: Theme.of(context).disabledColor)),
                enabled: false,
              ),
              ListTile(
                leading: Icon(Icons.shuffle_outlined,
                    color: Theme.of(context).disabledColor),
                title: Text('랜덤 추천 (준비중)',
                    style: TextStyle(color: Theme.of(context).disabledColor)),
                enabled: false,
              ),
            ],
          ),
        );
      },
    );
  }

  // Preset picker is temporarily disabled (준비중).
}


