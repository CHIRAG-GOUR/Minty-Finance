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
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { AuthGate } from './src/screens/auth/AuthGate';

// Screens
import { HomeScreen } from './src/screens/HomeScreen';
import { InvestScreen } from './src/screens/InvestScreen';
import { SharkTankScreen } from './src/screens/SharkTankScreen';
import { PortfolioScreen } from './src/screens/PortfolioScreen';
import { RewardsScreen } from './src/screens/RewardsScreen';
import { ProfileScreen } from './src/screens/ProfileScreen';

// Modals
import { SharkTankModal } from './src/screens/SharkTankModal';
import { LessonDetailModal } from './src/screens/LessonDetailModal';
import { AIAdvisorModal } from './src/screens/AIAdvisorModal';
import { StockTradeModal } from './src/screens/StockTradeModal';
import { FundInvestModal } from './src/screens/FundInvestModal';
import { FDCreateModal } from './src/screens/FDCreateModal';
import { LevelInfoModal } from './src/screens/LevelInfoModal';
import { CompoundCalculatorModal } from './src/screens/CompoundCalculatorModal';
import { MutualFundsScreen } from './src/screens/MutualFundsScreen';
import { TabType } from './src/types';

/** Label used by the boundary fallback for whichever tab is showing. */
const SCREEN_LABELS: Record<string, string> = {
  home: 'The home dashboard',
  invest: 'Stocks trading floor',
  markets: 'Mutual Funds & FDs',
  shark_tank: 'Startup pitch arena',
  portfolio: 'Your portfolio',
  profile: 'Your profile',
  rewards: 'Rewards',
};

const ActiveScreen: React.FC<{ tab: TabType }> = ({ tab }) => {
  switch (tab) {
    case 'invest':
      return <InvestScreen />;
    case 'markets':
      return <MutualFundsScreen />;
    case 'portfolio':
      return <PortfolioScreen />;
    case 'shark_tank':
      return <SharkTankScreen />;
    case 'profile':
      return <ProfileScreen />;
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
  const { isLoading, activeTab, toast, closeModal, activeModal, setActiveTab } = useApp();

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

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={THEME.colors.primary} />
        <Text style={styles.loadingText}>Loading your simulation...</Text>
      </View>
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

/**
 * Decides between the authentication flow and the app itself.
 *
 * `status` comes straight from Firebase, so the simulation is unreachable until
 * a phone number has actually been verified and a profile exists. AppProvider
 * is mounted only inside the authenticated branch, which is what keeps every
 * wallet, holding and transaction scoped to one UID.
 */
const Root: React.FC = () => {
  const { status } = useAuth();
  const [splashDone, setSplashDone] = React.useState(false);

  if (status === 'initializing' || !splashDone) {
    return (
      <SplashScreen
        isLoaded={status !== 'initializing'}
        onFinish={() => setSplashDone(true)}
      />
    );
  }

  if (status !== 'authenticated') {
    return (
      <ErrorBoundary section="Sign in">
        <AuthGate />
      </ErrorBoundary>
    );
  }

  return (
    <AppProvider>
      <MainNavigator />
    </AppProvider>
  );
};

export default function App() {
  return (
    <SafeAreaProvider>
      {/* Last line of defence: a fault above this point would close the app. */}
      <ErrorBoundary section="Minty Finance">
        <AuthProvider>
          <Root />
        </AuthProvider>
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
