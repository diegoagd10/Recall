# Active Recall Learning App

## Overview

This is a React Native mobile application built with Expo that implements an active recall learning system. The app allows users to authenticate, browse study notes, practice with questions, and track their learning progress. The application connects to a backend API service hosted on n8n for data retrieval and management, focusing on spaced repetition and active recall learning methodologies.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
The application uses React Native with Expo framework for cross-platform mobile development. The navigation system is built with React Navigation v6, implementing a stack-based navigation pattern with four main screens:

- **Authentication Flow**: Login screen with secure credential validation
- **Notes Management**: List view of available study materials with metadata
- **Practice Interface**: Interactive question-answer sessions with audio recording capabilities
- **Results Display**: Performance tracking and review of incorrect answers

The app implements a singleton pattern for service classes to ensure consistent state management across the application. Local state is managed using React hooks, with session persistence handled through AsyncStorage and SecureStore for sensitive data.

### Data Storage Solutions
The application uses a hybrid storage approach:
- **SecureStore**: For storing authentication tokens and sensitive credentials
- **AsyncStorage**: For caching user session data and application preferences
- **Remote API**: Primary data source for notes and questions, with no local database implementation

### Authentication and Authorization
Authentication follows an OAuth2-style token-based system:
- Users authenticate with username/password credentials
- Backend returns JWT access tokens with expiration times
- Tokens are stored securely and automatically refreshed when needed
- AuthGuard component protects routes and manages authentication state
- Automatic logout and redirect to login on token expiration

### Audio Integration
The practice system includes audio recording capabilities:
- Uses Expo Audio for recording user responses
- Implements permission handling for microphone access
- Supports playback of recorded answers for review
- Graceful fallback to text-only mode when audio is unavailable

### API Integration
The app communicates with a backend API hosted on n8n platform:
- **Base URL**: `https://n8n.srv913906.hstgr.cloud/webhook/api`
- **Authentication Endpoint**: `/tokens` for obtaining access tokens
- **Notes Endpoint**: `/active-recall/notes` for fetching study materials
- **Questions Endpoint**: Custom webhook URLs for retrieving practice questions

All API requests include proper error handling, loading states, and automatic retry mechanisms for network failures.

## External Dependencies

### Core Framework
- **Expo SDK 54**: Cross-platform development framework
- **React Native 0.81.4**: Mobile application framework
- **React 19.1.0**: UI component library

### Navigation
- **React Navigation v7**: Navigation library with stack and tab navigation
- **React Native Screens**: Native screen management
- **React Native Safe Area Context**: Safe area handling

### Storage and Security
- **AsyncStorage**: Local data persistence
- **Expo SecureStore**: Secure credential storage

### Audio Processing
- **Expo Audio**: Audio recording and playback
- **Expo AV**: Additional audio/video capabilities
- **Expo Media Library**: Media file management

### UI and Interactions
- **React Native Gesture Handler**: Touch gesture management
- **React Native Reanimated**: Animation library
- **Masked View**: UI component masking

### Backend Integration
- **n8n Webhook Platform**: Backend API service hosted at `https://n8n.srv913906.hstgr.cloud`
- **JWT Token Authentication**: Bearer token-based API authorization
- **REST API**: HTTP-based communication protocol

The application is designed to work offline for cached content while requiring internet connectivity for fetching new study materials and syncing progress data.