# sigbang

A new Flutter project.

## Getting Started

This project is a starting point for a Flutter application that follows the
[simple app state management
tutorial](https://flutter.dev/to/state-management-sample).

For help getting started with Flutter development, view the
[online documentation](https://docs.flutter.dev), which offers tutorials,
samples, guidance on mobile development, and a full API reference.

### build
keytool -genkey -v -keystore my-release-key.keystore -alias release  -keyalg RSA -keysize 2048 -validity 10000

What is your first and last name?
  [Unknown]:  Lee Hyosub
What is the name of your organizational unit?
  [Unknown]:  Aminity
What is the name of your organization?
  [Unknown]:  Aminity
What is the name of your City or Locality?
  [Unknown]:  Seoul
What is the name of your State or Province?
  [Unknown]:  Korea 
What is the two-letter country code for this unit?
  [Unknown]:  KR
Is CN=Lee Hyosub, OU=Aminity, O=Aminity, L=Seoul, ST=Korea, C=KR correct?
  [no]:  yes

storePassword=비밀번호
keyPassword=비밀번호
keyAlias=release
storeFile=../app/my-release-key.keystore

flutter build apk --release

flutter build appbundle --release