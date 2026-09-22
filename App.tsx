import React, { useMemo } from 'react';
import { View, StyleSheet, ActivityIndicator, StatusBar, Text, BackHandler } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { AppProvider, useApp } from './src/context/AppContext';
import { THEME } from './src/constants/theme';
import { NeoHeader } from './src/components/common/NeoHeader';
import { FloatingTabBar } from './src/components/navigation/FloatingTabBar';
import { ToastNotification } from './src/components/common/ToastNotification';
import { ErrorBoundary } from './src/components/common/ErrorBoundary';
import { SplashScreen } from './src/components/common/SplashScreen';

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
import { TabType } from './src/types';

/** Label used by the boundary fallback for whichever tab is showing. */
const SCREEN_LABELS: Record<string, string> = {
  home: 'The home dashboard',
  markets: 'The markets list',
  wealth_lab: 'The wealth lab',
  shark_tank: 'Shark Tank',
  classroom: 'The classroom',
  admin_control: 'The admin desk',
  profile: 'Your profile',
  learn: 'The learn hub',
  portfolio: 'Your portfolio',
  rewards: 'Rewards',
};

const ActiveScreen: React.FC<{ tab: TabType }> = ({ tab }) => {
  switch (tab) {
    case 'markets':
    case 'invest':
      return <InvestScreen />;
    case 'wealth_lab':
    case 'budget':
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
    case 'home':
    default:
      return <HomeScreen />;
  }
};

/**
 * Renders only the modal that is actually open.
 *
 * Previously every modal stayed mounted and each one received the shared
 * `modalData`, so a fund payload was handed to the stock sheet, a lesson to the
 * fund sheet, and so on — and all of them re-rendered on every market tick.
 */
const ActiveModal: React.FC = () => {
  const { activeModal, modalData, closeModal, sharkTankStartups } = useApp();
  if (!activeModal) return null;

  switch (activeModal) {
    case 'role_selector':
      return <RoleSelectorModal visible onClose={closeModal} />;
    case 'quick_action_terminal':
      return <QuickTerminalModal visible onClose={closeModal} />;
    case 'add_stock_modal':
      return <AddStockModal visible onClose={closeModal} />;
    case 'create_challenge':
      return <CreateChallengeModal />;
    case 'shark_tank':
    case 'shark_tank_pitch':
      return (
        <SharkTankModal
          visible
          startup={modalData ?? sharkTankStartups[0]}
          onClose={closeModal}
        />
      );
    case 'lesson_detail':
      return <LessonDetailModal visible lesson={modalData} onClose={closeModal} />;
    case 'ai_advisor':
      return <AIAdvisorModal visible onClose={closeModal} />;
    case 'stock_trade':
      return <StockTradeModal visible data={modalData} onClose={closeModal} />;
    case 'fund_invest':
      return <FundInvestModal visible data={modalData} onClose={closeModal} />;
    case 'open_fd_confirm':
      return <FDCreateModal visible data={modalData} onClose={closeModal} />;
    case 'level_info':
    case 'streak_info':
    case 'simulation_info':
      return <LevelInfoModal visible onClose={closeModal} />;
    case 'compound_calculator':
      return <CompoundCalculatorModal visible onClose={closeModal} />;
    default:
      return null;
  }
};

const MainNavigator: React.FC = () => {
  const { isLoading, userProfile, activeTab, toast, closeModal, activeModal, setActiveTab } =
    useApp();

  const [isSplashComplete, setIsSplashComplete] = React.useState(false);

  const screenLabel = useMemo(
    () => SCREEN_LABELS[activeTab] ?? 'This screen',
    [activeTab]
  );

  /**
   * Android hardware back. Without this the app has no back stack at all, so
   * back from any tab dropped the student straight out of the simulation.
   * Order: close an open sheet, else step back to Home, else let Android exit.
   * Registered above the early returns so the hook count never changes.
   */
  React.useEffect(() => {
    const onBack = () => {
      if (activeModal) {
        closeModal();
        return true;
      }
      if (activeTab !== 'home') {
        setActiveTab('home');
        return true;
      }
      return false;
    };
    const sub = BackHandler.addEventListener('hardwareBackPress', onBack);
    return () => sub.remove();
  }, [activeModal, activeTab, closeModal, setActiveTab]);

  if (isLoading || !isSplashComplete) {
    return (
      <SplashScreen
        isLoaded={!isLoading}
        onFinish={() => setIsSplashComplete(true)}
      />
    );
  }

  if (!userProfile.isOnboarded) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'left', 'right', 'bottom']}>
        <StatusBar barStyle="dark-content" backgroundColor={THEME.colors.background} />
        <ErrorBoundary section="Onboarding">
          <OnboardingScreen />
        </ErrorBoundary>
        <ToastNotification toast={toast} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor={THEME.colors.background} />

      <ErrorBoundary section="The header">
        <NeoHeader />
      </ErrorBoundary>

      {/*
        Keyed by tab so switching tabs mounts a clean subtree, which also clears
        a boundary that tripped on the previous screen.
      */}
      <View style={styles.screenContainer}>
        <ErrorBoundary key={activeTab} section={screenLabel}>
          <ActiveScreen tab={activeTab} />
        </ErrorBoundary>
      </View>

      <ErrorBoundary section="Navigation">
        <FloatingTabBar />
      </ErrorBoundary>

      <ToastNotification toast={toast} />

      <ErrorBoundary section="This panel" onGoBack={closeModal}>
        <ActiveModal />
      </ErrorBoundary>
    </SafeAreaView>
  );
};

export default function App() {
  return (
    <SafeAreaProvider>
      {/* Last line of defence: a fault above this point would close the app. */}
      <ErrorBoundary section="Minti Finance">
        <AppProvider>
          <MainNavigator />
        </AppProvider>
      </ErrorBoundary>
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
    gap: 12,
  },
  loadingText: {
    fontSize: 13,
    fontWeight: '600',
    color: THEME.colors.textSecondary,
  },
  screenContainer: {
    flex: 1,
  },
});
