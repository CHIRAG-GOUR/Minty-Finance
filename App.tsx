import React from 'react';
import { View, StyleSheet, ActivityIndicator, StatusBar } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { AppProvider, useApp } from './src/context/AppContext';
import { THEME } from './src/constants/theme';
import { NeoHeader } from './src/components/common/NeoHeader';
import { FloatingTabBar } from './src/components/navigation/FloatingTabBar';
import { ToastNotification } from './src/components/common/ToastNotification';

// Screens
import { OnboardingScreen } from './src/screens/OnboardingScreen';
import { HomeScreen } from './src/screens/HomeScreen';
import { InvestScreen } from './src/screens/InvestScreen';
import { BudgetScreen } from './src/screens/BudgetScreen';
import { SharkTankScreen } from './src/screens/SharkTankScreen';
import { ClassroomScreen } from './src/screens/ClassroomScreen';
import { AdminControlScreen } from './src/screens/AdminControlScreen';
import { PortfolioScreen } from './src/screens/PortfolioScreen';
import { LearnScreen } from './src/screens/LearnScreen';
import { RewardsScreen } from './src/screens/RewardsScreen';
import { ProfileScreen } from './src/screens/ProfileScreen';

// Modals
import { RoleSelectorModal } from './src/screens/RoleSelectorModal';
import { QuickTerminalModal } from './src/screens/QuickTerminalModal';
import { AddStockModal } from './src/screens/AddStockModal';
import { CreateChallengeModal } from './src/screens/CreateChallengeModal';
import { SharkTankModal } from './src/screens/SharkTankModal';
import { LessonDetailModal } from './src/screens/LessonDetailModal';
import { AIAdvisorModal } from './src/screens/AIAdvisorModal';
import { StockTradeModal } from './src/screens/StockTradeModal';
import { FundInvestModal } from './src/screens/FundInvestModal';
import { FDCreateModal } from './src/screens/FDCreateModal';
import { LevelInfoModal } from './src/screens/LevelInfoModal';
import { CompoundCalculatorModal } from './src/screens/CompoundCalculatorModal';

const MainNavigator: React.FC = () => {
  const {
    isLoading,
    userProfile,
    activeTab,
    toast,
    activeModal,
    modalData,
    closeModal,
    sharkTankStartups,
  } = useApp();

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={THEME.colors.primary} />
      </View>
    );
  }

  if (!userProfile.isOnboarded) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
        <StatusBar barStyle="dark-content" backgroundColor={THEME.colors.background} />
        <OnboardingScreen />
        <ToastNotification toast={toast} />
      </SafeAreaView>
    );
  }

  const renderActiveScreen = () => {
    switch (activeTab) {
      case 'home':
        return <HomeScreen />;
      case 'markets':
        return <InvestScreen />;
      case 'wealth_lab':
        return <BudgetScreen />;
      case 'shark_tank':
        return <SharkTankScreen />;
      case 'classroom':
        return <ClassroomScreen />;
      case 'admin_control':
        return <AdminControlScreen />;
      case 'profile':
        return <ProfileScreen />;
      case 'learn':
        return <LearnScreen />;
      case 'portfolio':
        return <PortfolioScreen />;
      case 'rewards':
        return <RewardsScreen />;
      default:
        return <HomeScreen />;
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor={THEME.colors.background} />

      {/* Role Badge & Profile Notch-Safe Header */}
      <NeoHeader />

      {/* Active Screen View */}
      <View style={styles.screenContainer}>{renderActiveScreen()}</View>

      {/* Floating Obsidian Dock Tab Bar with Center Waveform Action Button */}
      <FloatingTabBar />

      {/* Floating Toast Notification */}
      <ToastNotification toast={toast} />

      {/* RBAC & Action Modals */}
      <RoleSelectorModal
        visible={activeModal === 'role_selector'}
        onClose={closeModal}
      />

      <QuickTerminalModal
        visible={activeModal === 'quick_action_terminal'}
        onClose={closeModal}
      />

      <AddStockModal
        visible={activeModal === 'add_stock_modal'}
        onClose={closeModal}
      />

      <CreateChallengeModal />

      <SharkTankModal
        visible={activeModal === 'shark_tank' || activeModal === 'shark_tank_pitch'}
        startup={modalData || sharkTankStartups[0]}
        onClose={closeModal}
      />

      <LessonDetailModal
        visible={activeModal === 'lesson_detail'}
        lesson={modalData}
        onClose={closeModal}
      />

      <AIAdvisorModal
        visible={activeModal === 'ai_advisor'}
        onClose={closeModal}
      />

      <StockTradeModal
        visible={activeModal === 'stock_trade'}
        data={modalData}
        onClose={closeModal}
      />

      <FundInvestModal
        visible={activeModal === 'fund_invest'}
        data={modalData}
        onClose={closeModal}
      />

      <FDCreateModal
        visible={activeModal === 'open_fd_confirm'}
        data={modalData}
        onClose={closeModal}
      />

      <LevelInfoModal
        visible={activeModal === 'level_info' || activeModal === 'streak_info' || activeModal === 'simulation_info'}
        onClose={closeModal}
      />

      <CompoundCalculatorModal
        visible={activeModal === 'compound_calculator'}
        onClose={closeModal}
      />
    </SafeAreaView>
  );
};

export default function App() {
  return (
    <SafeAreaProvider>
      <AppProvider>
        <MainNavigator />
      </AppProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.colors.background,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: THEME.colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  screenContainer: {
    flex: 1,
  },
});
