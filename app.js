import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from 'react';
import {
  Text,
  View,
  TouchableOpacity,
  StyleSheet,
  Image,
  ScrollView,
  Modal,
  Animated,
  Alert,
  Easing,
  ImageBackground,
  TextInput,
} from 'react-native';
import { Audio } from 'expo-av';
import Slider from '@react-native-community/slider';
import * as Battery from 'expo-battery';
import { Asset } from 'expo-asset';
import Song1 from './assets/Song 1.mp3';
import Song2 from './assets/Song 2.mp3';
import Song3 from './assets/Song 3.mp3';
import { Ionicons } from '@expo/vector-icons';

const dailyQuestPool = [
  { description: 'Erreiche Level 5', reward: 2000 },
  { description: 'Verdiene 70000€', reward: 4000 },
  { description: 'Kaufe 3 Pflanzen', reward: 1500 },
  { description: 'Kaufe 2 Dealer', reward: 3000 },
  { description: 'Kaufe 1 Weed Upgrade', reward: 4000 },
  { description: 'Erhöhe deine Speed um 5', reward: 2500 },
  { description: 'Erziele 10 Upgrades insgesamt', reward: 5000 },
  { description: 'Erreiche 100000€ Gewinn', reward: 6000 },
  { description: 'Kaufe 2 Speed Labors', reward: 3500 },
  { description: 'Kaufe 1 Wohnwagen', reward: 4000 },
];

function getDailyQuests() {
  const shuffled = dailyQuestPool
    .map((value) => ({ value, sort: Math.random() }))
    .sort((a, b) => a.sort - b.sort)
    .map(({ value }, idx) => ({
      ...value,
      id: idx + 1,
      completed: false,
      active: false,
      progress: 0,
      target: 100,
    }));
  return shuffled.slice(0, 5);
}

function formatTime(ms) {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = String(Math.floor(totalSeconds / 3600)).padStart(2, '0');
  const minutes = String(Math.floor((totalSeconds % 3600) / 60)).padStart(
    2,
    '0'
  );
  const seconds = String(totalSeconds % 60).padStart(2, '0');
  return `${hours}:${minutes}:${seconds}`;
}

const fruitHeight = 75;

// Dynamic Achievements definitions: 10 metrics × steps = ~50 achievements
const achievementMetrics = [
  { metric: 'plants', label: 'Besitze Pflanzen', steps: [10,20,30,40,50] },
  { metric: 'speedLabs', label: 'Besitze Speed-Labore', steps: [10,20,30,40,50] },
  { metric: 'koksLabs', label: 'Besitze Koks-Labore', steps: [10,20,30,40,50] },
  { metric: 'totalWeedProduced', label: 'Produziere Weed', steps: [1000,2000,3000,4000,5000] },
  { metric: 'totalSpeedProduced', label: 'Produziere Speed', steps: [1000,2000,3000,4000,5000] },
  { metric: 'totalKoksProduced', label: 'Produziere Koks', steps: [1000,2000,3000,4000,5000] },
  { metric: 'dealers', label: 'Dealer', steps: [1,5,10,20,50] },
  { metric: 'caravans', label: 'Wohnwagen', steps: [1,5,10] },
  { metric: 'weedUpgrade', label: 'Weed Upgrades', steps: [1,2,3,4,5] },
  { metric: 'dealerUpgrade', label: 'Dealer Upgrades', steps: [1,2,3,4,5] },
  { metric: 'speedUpgrade', label: 'Speed Upgrades', steps: [1,2,3,4,5] },
  { metric: 'caravanUpgrade', label: 'Speed-Labor Upgrades', steps: [1,2,3,4,5] },
  { metric: 'koksUpgrade', label: 'Koks Upgrades', steps: [1,2,3,4,5] },
  { metric: 'koksTaxiUpgrade', label: 'Koks-Labor Upgrades', steps: [1,2,3,4,5] },
];

// Initial Drogen achievements for dynamic progression
const initialDrogenAchievements = [
  { metric: 'plants', label: 'Besitze Pflanzen', target: 10, step: 10, progress: 0, completed: false },
  { metric: 'speedLabs', label: 'Besitze Speed-Labore', target: 10, step: 10, progress: 0, completed: false },
  { metric: 'koksLabs', label: 'Besitze Koks-Labore', target: 10, step: 10, progress: 0, completed: false },
  { metric: 'totalWeedProduced', label: 'Produziere Weed', target: 1000, step: 1000, progress: 0, completed: false },
  { metric: 'totalSpeedProduced', label: 'Produziere Speed', target: 1000, step: 1000, progress: 0, completed: false },
  { metric: 'totalKoksProduced', label: 'Produziere Koks', target: 1000, step: 1000, progress: 0, completed: false },
];

// Initial Dealer achievements for dynamic progression
const initialDealerAchievements = [
  { metric: 'dealers', label: 'Besitze Dealer', target: 10, step: 10, progress: 0, completed: false },
  { metric: 'caravans', label: 'Besitze Camper', target: 10, step: 10, progress: 0, completed: false },
  { metric: 'koksTaxis', label: 'Besitze Koks-Taxis', target: 10, step: 10, progress: 0, completed: false },
];

// Initial Upgrade achievements for dynamic progression
const initialUpgradeAchievements = [
  { metric: 'weedUpgrade', label: 'Besitze Weed Upgrades', target: 10, step: 10, progress: 0, completed: false, collectAmount: 500 },
  { metric: 'dealerUpgrade', label: 'Besitze Pflanzen Upgrades', target: 10, step: 10, progress: 0, completed: false, collectAmount: 500 },
  { metric: 'speedUpgrade', label: 'Besitze Speed Upgrades', target: 10, step: 10, progress: 0, completed: false, collectAmount: 500 },
  { metric: 'caravanUpgrade', label: 'Besitze Speed-Labor Upgrades', target: 10, step: 10, progress: 0, completed: false, collectAmount: 500 },
  { metric: 'koksUpgrade', label: 'Besitze Koks Upgrades', target: 10, step: 10, progress: 0, completed: false, collectAmount: 500 },
  { metric: 'koksTaxiUpgrade', label: 'Besitze Koks-Labor Upgrades', target: 10, step: 10, progress: 0, completed: false, collectAmount: 500 },
];

let achievementId = 1;
function getInitialAchievements() {
  return achievementMetrics.flatMap(({ metric, label, steps }) =>
    steps.map((step, idx) => ({
      id: achievementId++,
      description: `${label}: ${step}`,
      metric,
      target: step,
      reward: (idx + 1) * 100,
      completed: false,
      progress: 0,
    }))
  );
}

export default function App() {
  // Basis
  const [money, setMoney] = useState(2500);
  const [weed, setWeed] = useState(0);
  const [speed, setSpeed] = useState(0);
  const [koks, setKoks] = useState(0);
  const maxWeed = 1000;
  const maxSpeed = 1000;
  const maxKoks = 1000;

  const [plants, setPlants] = useState(0);
  const [dealers, setDealers] = useState(0);
  const [speedLabs, setSpeedLabs] = useState(0);
  const [caravans, setCaravans] = useState(0);
  const [koksLabs, setKoksLabs] = useState(0);
  const [koksTaxis, setKoksTaxis] = useState(0);

  // Upgrades
  const [weedUpgrade, setWeedUpgrade] = useState(0);
  const [dealerUpgrade, setDealerUpgrade] = useState(0);
  const [speedUpgrade, setSpeedUpgrade] = useState(0);
  const [caravanUpgrade, setCaravanUpgrade] = useState(0);
  const [koksUpgrade, setKoksUpgrade] = useState(0);
  const [koksTaxiUpgrade, setKoksTaxiUpgrade] = useState(0);

  // XP & Level
  const [xp, setXp] = useState(0);
  const [level, setLevel] = useState(1);

  // Level-to-Rang Mapping
  const rankNames = [
    'Straßenratte','Kleindealer','Kurier','Laufbursche','Taschenjunkie',
    'Einsteiger','Möchtegern-Gangster','Viertel-Dealer','Schläger','Fixer',
    'Crackkoch','Gassenboss','Drogenküchenhelfer','Straßenchef','Bandenmitglied',
    'Revierboss','Dealer-Koordinator','Pillendreher','Lokaler Lieferant','Gangleader',
    'Kleinkartellboss','Schmuggler','Laborleiter','Kokskoch','Bezirksboss',
    'Vertrauensperson','Kartellkontakt','Grenzschieber','Unterboss','Lagerverwalter',
    'Kokainkapitän','Mittlerer Kartellboss','Kartell-Stratege','Netzwerkleiter','Großdealer',
    'Chemiker','Schattenboss','Importkönig','Oberster Schmuggler','Kartell-Veteran',
    'Syndikatsführer','Kokainbaron','Schattenkartell','Narco-General','Imperiumsarchitekt',
    'Pate der Unterwelt','Weltkartellboss','Phantom-Legende','Globaler Drogenzar','Der Don'
  ];
  const currentRank = rankNames[level - 1] || '';

  // Musik-/Sound
  const [settingsVisible, setSettingsVisible] = useState(false);
  const [musicEnabled, setMusicEnabled] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [music, setMusic] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [songIndex, setSongIndex] = useState(0);
  const [volume, setVolume] = useState(1);
  const [currentSongName, setCurrentSongName] = useState('');
  // Level-Up Animation
  const levelUpAnim = useRef(new Animated.Value(0)).current;
  const [levelUpBonus, setLevelUpBonus] = useState(0);

  // Kategorien
  const [showDrogen, setShowDrogen] = useState(true);
  const [showDealer, setShowDealer] = useState(true);
  const [showUpgrades, setShowUpgrades] = useState(true);

  // Slot Machine
  const [slotModalVisible, setSlotModalVisible] = useState(false);
  const [betAmount, setBetAmount] = useState(10);
  const [slotResult, setSlotResult] = useState('');
  const [autoSpin, setAutoSpin] = useState(false);

  // Achievements
  const [achievementModalVisible, setAchievementModalVisible] = useState(false);
  const [achievements, setAchievements] = useState(getInitialAchievements());
  const [showDrogenAchievements, setShowDrogenAchievements] = useState(true);
  const [showDealerAchievements, setShowDealerAchievements] = useState(true);
  const [showUpgradesAchievements, setShowUpgradesAchievements] = useState(true);

  const [totalWeedProduced, setTotalWeedProduced] = useState(0);
  const [totalSpeedProduced, setTotalSpeedProduced] = useState(0);
  const [totalKoksProduced, setTotalKoksProduced] = useState(0);

  // Drogen achievements
  const [drogenAchievements, setDrogenAchievements] = useState(
    initialDrogenAchievements.map((a, idx) => ({
      ...a,
      id: idx,
      description: `${a.label}: ${a.target}`,
    }))
  );
  const [drogenCollectAmount, setDrogenCollectAmount] = useState(500);
  // Dealer achievements
  const [dealerAchievements, setDealerAchievements] = useState(
    initialDealerAchievements.map((a, idx) => ({
      ...a,
      id: idx,
      description: `${a.label}: ${a.target}`,
    }))
  );
  const [dealerCollectAmount, setDealerCollectAmount] = useState(500);
  // Upgrade achievements
  const [upgradeAchievements, setUpgradeAchievements] = useState(
    initialUpgradeAchievements.map((a, idx) => ({
      ...a,
      id: idx,
      description: `${a.label}: ${a.target}`,
    }))
  );
  const [upgradeCollectAmount, setUpgradeCollectAmount] = useState(500);

  // Crypto Mining
  const [basicMiners, setBasicMiners] = useState(0);
  const [proMiners, setProMiners] = useState(0);
  const [nuclearRigs, setNuclearRigs] = useState(0);
  const [btc, setBtc] = useState(0);
  const [cryptoModalVisible, setCryptoModalVisible] = useState(false);
  const [basicLogs, setBasicLogs] = useState([]);
  const [proLogs, setProLogs] = useState([]);
  const [nuclearLogs, setNuclearLogs] = useState([]);
  let basicLogInterval, proLogInterval, nuclearLogInterval;
  const prevBasicMinersRef = useRef(0);
  const prevProMinersRef = useRef(0);
  const prevNuclearRigsRef = useRef(0);

  // Crypto-Mining: Basic Miners (2-5 Min Interval)
  useEffect(() => {
    if (basicMiners <= 0) return;
    let mounted = true;
    let nextTimeout;
    const minInterval = 2 * 60 * 1000;
    const maxInterval = 5 * 60 * 1000;
    const mineCycle = () => {
      setBasicLogs(prev => [...prev, 'Hashing...']);
      setTimeout(() => {
        if (!mounted) return;
        const found = basicMiners * (0.001 + Math.random() * 0.001);
        setBtc(prev => prev + found);
        setBasicLogs(prev => [...prev, `Block Found! ${found.toFixed(4)} BTC`]);
        setTimeout(() => {
          if (!mounted) return;
          setBasicLogs(prev => [...prev, 'Restart...']);
          const next = Math.random() * (maxInterval - minInterval) + minInterval;
          nextTimeout = setTimeout(mineCycle, next);
        }, 1000);
      }, 2000);
    };
    mineCycle();
    return () => { mounted = false; clearTimeout(nextTimeout); };
  }, [basicMiners]);

  // Crypto-Mining: Pro Miners (2-5 Min Interval)
  useEffect(() => {
    if (proMiners <= 0) return;
    let mounted = true;
    let nextTimeout;
    const minInterval = 2 * 60 * 1000;
    const maxInterval = 5 * 60 * 1000;
    const mineCycle = () => {
      setProLogs(prev => [...prev, 'Hashing...']);
      setTimeout(() => {
        if (!mounted) return;
        const found = proMiners * (0.005 + Math.random() * 0.005);
        setBtc(prev => prev + found);
        setProLogs(prev => [...prev, `Block Found! ${found.toFixed(4)} BTC`]);
        setTimeout(() => {
          if (!mounted) return;
          setProLogs(prev => [...prev, 'Restart...']);
          const next = Math.random() * (maxInterval - minInterval) + minInterval;
          nextTimeout = setTimeout(mineCycle, next);
        }, 1000);
      }, 2000);
    };
    mineCycle();
    return () => { mounted = false; clearTimeout(nextTimeout); };
  }, [proMiners]);

  // Crypto-Mining: Nuclear Rigs (2-5 Min Interval)
  useEffect(() => {
    if (nuclearRigs <= 0) return;
    let mounted = true;
    let nextTimeout;
    const minInterval = 2 * 60 * 1000;
    const maxInterval = 5 * 60 * 1000;
    const mineCycle = () => {
      setNuclearLogs(prev => [...prev, 'Hashing...']);
      setTimeout(() => {
        if (!mounted) return;
        const found = nuclearRigs * (0.02 + Math.random() * 0.02);
        setBtc(prev => prev + found);
        setNuclearLogs(prev => [...prev, `Block Found! ${found.toFixed(4)} BTC`]);
        setTimeout(() => {
          if (!mounted) return;
          setNuclearLogs(prev => [...prev, 'Restart...']);
          const next = Math.random() * (maxInterval - minInterval) + minInterval;
          nextTimeout = setTimeout(mineCycle, next);
        }, 1000);
      }, 2000);
    };
    mineCycle();
    return () => { mounted = false; clearTimeout(nextTimeout); };
  }, [nuclearRigs]);

  // Darkweb App
  const [darkwebModalVisible, setDarkwebModalVisible] = useState(false);
  const [chatThreads, setChatThreads] = useState([]);
  const [selectedThreadId, setSelectedThreadId] = useState(null);
  const spawnTimeoutRef = useRef(null);
  const smsSoundRef = useRef(null);
  const [saleRates, setSaleRates] = useState({ weed: 0.001, speed: 0.002, koks: 0.003 });
  const customerNames = ['John','Emily','Michael','Sarah','David','Jessica','James','Ashley','Robert','Amanda'];
  const minSpawn = 2 * 60 * 1000;   // 2 minutes
  const maxSpawn = 10 * 60 * 1000;  // 10 minutes
  const spawnCustomer = () => {
    const drugs = ['weed','speed','koks'];
    const drugKey = drugs[Math.floor(Math.random() * drugs.length)];
    const customerName = customerNames[Math.floor(Math.random() * customerNames.length)];
    const qty = Math.floor(Math.random() * 151) + 50; // min 50g
    const id = Date.now();
    setChatThreads(prev => [...prev, {
      id, name: customerName, drug: drugKey, qty,
      logs: [{ id: Date.now(), text: `${customerName}: sucht ${qty}g ${drugKey}`, type: 'customer', timestamp: new Date() }],
      awaitingResponse: true,
    }]);
    setSelectedThreadId(id);
    const interval = Math.random() * (maxSpawn - minSpawn) + minSpawn;
    spawnTimeoutRef.current = setTimeout(spawnCustomer, interval);
    // Play SMS sound if modal is closed
    if (!darkwebModalVisible && smsSoundRef.current) {
      smsSoundRef.current.replayAsync();
    }
  };
  useEffect(() => {
    // Load SMS notification sound
    (async () => {
      const { sound } = await Audio.Sound.createAsync(require('./assets/sms.mp3'));
      smsSoundRef.current = sound;
    })();
    return () => smsSoundRef.current?.unloadAsync();
  }, []);
  useEffect(() => {
    spawnCustomer();
    return () => clearTimeout(spawnTimeoutRef.current);
  }, []);
  const [inputText, setInputText] = useState('');
  const handleSend = (text) => {
    if (!text.trim()) return;
    handleResponse(selectedThreadId, text);
    setInputText('');
  };
  const handleResponse = (threadId, response) => {
    setChatThreads(prev => prev.map(th => {
      if (th.id !== threadId) return th;
      const logs = [...th.logs, { id: Date.now(), text: response, type: 'user', timestamp: new Date() }];
      const available = th.drug === 'weed'
        ? weed : th.drug === 'speed'
        ? speed : koks;
      let logMsg;
      if (response.includes('Ja')) {
        if (available >= th.qty) {
          if (th.drug === 'weed') setWeed(p => p - th.qty);
          else if (th.drug === 'speed') setSpeed(p => p - th.qty);
          else setKoks(p => p - th.qty);
          const price = saleRates[th.drug] * 2 * th.qty;
          setMoney(prev => prev + price);
          logMsg = `${th.name}: Verkauf erfolgreich: ${th.qty}g ${th.drug} → ${price.toFixed(2)} €`;
        } else logMsg = `${th.name}: Verkauf fehlgeschlagen: ${th.qty}g ${th.drug} nicht auf Lager`;
      } else logMsg = `${th.name}: Kunde abgewiesen`;
      return { ...th, logs: [...logs, { id: Date.now()+1, text: logMsg, type: 'system', timestamp: new Date() }], awaitingResponse: false };
    }));
    const interval = Math.random() * (maxSpawn - minSpawn) + minSpawn;
    spawnTimeoutRef.current = setTimeout(spawnCustomer, interval);
  };

  // Shop
  const [shopModalVisible, setShopModalVisible] = useState(false);
  const shopItems = {
    Lebensmittel: [
      {
        name: 'Energy Trink',
        price: 1000,
        icon: require('./assets/energy.png'),
        effect: { costReduction: 0.05, duration: 300000 },
      },
      {
        name: 'Chips',
        price: 2500,
        icon: require('./assets/chips.png'),
        effect: { costReduction: 0.15, duration: 600000 },
      },
      {
        name: 'Burger',
        price: 5000,
        icon: require('./assets/burger.png'),
        effect: { costReduction: 0.25, duration: 900000 },
      },
    ],
    Waffen: [
      {
        name: 'Schlagring',
        price: 2000,
        icon: require('./assets/schlagring.png'),
        effect: { incomeBoost: 0.05, duration: 300000 },
      },
      {
        name: 'Schläger',
        price: 4000,
        icon: require('./assets/schläger.png'),
        effect: { incomeBoost: 0.15, duration: 600000 },
      },
      {
        name: 'Pistole',
        price: 8000,
        icon: require('./assets/gun.png'),
        effect: { incomeBoost: 0.25, duration: 900000 },
      },
    ],
    'Dünger & Streckmittel': [
      {
        name: 'Dünger',
        price: 1000,
        icon: require('./assets/dünger.png'),
        effect: { productionBoostWeed: 0.05, duration: 300000 },
      },
      {
        name: 'Koffeintabletten',
        price: 2500,
        icon: require('./assets/pills.png'),
        effect: { productionBoostSpeed: 0.05, duration: 300000 },
      },
      {
        name: 'Backpulver',
        price: 5000,
        icon: require('./assets/backpulver.png'),
        effect: { productionBoostKoks: 0.05, duration: 300000 },
      },
    ],
  };
  const [showLebensmittel, setShowLebensmittel] = useState(true);
  const [showWaffen, setShowWaffen] = useState(true);
  const [showDuenger, setShowDuenger] = useState(true);
  // Effekte
  const [costReduction, setCostReduction] = useState(0);
  const [incomeBoost, setIncomeBoost] = useState(0);
  const [productionBoostWeed, setProductionBoostWeed] = useState(0);
  const [productionBoostSpeed, setProductionBoostSpeed] = useState(0);
  const [productionBoostKoks, setProductionBoostKoks] = useState(0);

  // Handy-Menü
  const [phoneMenuVisible, setPhoneMenuVisible] = useState(false);
  const [batteryLevel, setBatteryLevel] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Slot Animation
  const fruitImages = [
    require('./assets/cherry.png'),
    require('./assets/lemon.png'),
    require('./assets/apple.png'),
    require('./assets/grape.png'),
  ];
  const multipliers = [10, 25, 50, 100];
  const reelAnim = useRef([
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
  ]).current;
  const winSoundRef = useRef(null);

  // **Wichtig**: Kauf-Sound
  const playBuySound = useCallback(async () => {
    if (!soundEnabled) return;
    try {
      const { sound } = await Audio.Sound.createAsync(
        require('./assets/Buy.mp3')
      );
      await sound.playAsync();
      setTimeout(() => sound.unloadAsync(), 1000);
    } catch (error) {
      console.error('BuySound error:', error);
    }
  }, [soundEnabled]);

  // Kosten & Produktionsraten
  const caravanCost = useMemo(() => 500 * (1 - costReduction), [costReduction]);
  const speedLabCost = useMemo(() => 500 * (1 - costReduction), [costReduction]);
  const koksLaborCost = useMemo(() => 2500 * (1 - costReduction), [costReduction]);
  const koksTaxiCost = useMemo(() => 800 * (1 - costReduction), [costReduction]);

  const weedUpgradeCost = useMemo(() => 300 * (weedUpgrade + 1) * (1 - costReduction), [weedUpgrade, costReduction]);
  const dealerUpgradeCost = useMemo(() => (500 + dealerUpgrade * 200) * (1 - costReduction), [dealerUpgrade, costReduction]);
  const speedUpgradeCost = useMemo(() => 1500 * (speedUpgrade + 1) * (1 - costReduction), [speedUpgrade, costReduction]);
  const caravanUpgradeCost = useMemo(() => 500 * (caravanUpgrade + 1) * (1 - costReduction), [caravanUpgrade, costReduction]);
  const koksUpgradeCost = useMemo(() => 7500 * (koksUpgrade + 1) * (1 - costReduction), [koksUpgrade, costReduction]);
  const koksTaxiUpgradeCost = useMemo(() => 5000 * (koksTaxiUpgrade + 1) * (1 - costReduction), [koksTaxiUpgrade, costReduction]);

  const plantCost = useMemo(() => 100 * (weedUpgrade + 1) * (1 - costReduction), [weedUpgrade, costReduction]);
  const dealerCost = useMemo(() => (200 + dealerUpgrade * 50) * (1 - costReduction), [dealerUpgrade, costReduction]);
  const dealerSalePrice = useMemo(() => 10 * (1 + 0.05 * dealerUpgrade) * (1 + incomeBoost), [dealerUpgrade, incomeBoost]);
  const speedSalePrice = useMemo(() => 20 * (1 + incomeBoost), [incomeBoost]);
  const koksSalePrice = useMemo(() => 50 * (1 + incomeBoost), [incomeBoost]);

  const plantProductionRate = useMemo(() => plants * (0.1 + dealerUpgrade * 0.1) * (1 + productionBoostWeed), [plants, dealerUpgrade, productionBoostWeed]);
  const speedProductionRate = useMemo(() => speedLabs * (0.5 + caravanUpgrade * 0.1) * (1 + productionBoostSpeed), [speedLabs, caravanUpgrade, productionBoostSpeed]);
  const koksProductionRate = useMemo(() => koksLabs * (0.5 + koksTaxiUpgrade * 0.1) * (1 + productionBoostKoks), [koksLabs, koksTaxiUpgrade, productionBoostKoks]);

  // Shop-Funktion
  const handleBuyShopItem = useCallback(
    (category, index) => {
      const item = shopItems[category][index];
      if (money < item.price) {
        Alert.alert('Nicht genug Geld');
        return;
      }
      setMoney((prev) => prev - item.price);

      // Effekte
      if (item.effect.costReduction) {
        setCostReduction(item.effect.costReduction);
        setTimeout(() => setCostReduction(0), item.effect.duration);
      }
      if (item.effect.incomeBoost) {
        setIncomeBoost(item.effect.incomeBoost);
        setTimeout(() => setIncomeBoost(0), item.effect.duration);
      }
      if (item.effect.productionBoostWeed) {
        setProductionBoostWeed(item.effect.productionBoostWeed);
        setTimeout(() => setProductionBoostWeed(0), item.effect.duration);
      }
      if (item.effect.productionBoostSpeed) {
        setProductionBoostSpeed(item.effect.productionBoostSpeed);
        setTimeout(() => setProductionBoostSpeed(0), item.effect.duration);
      }
      if (item.effect.productionBoostKoks) {
        setProductionBoostKoks(item.effect.productionBoostKoks);
        setTimeout(() => setProductionBoostKoks(0), item.effect.duration);
      }
    },
    [money, shopItems]
  );
  // Weitere Funktionen und der Rest deines Codes folgen hier...
  const closeShopModal = () => setShopModalVisible(false);

  // Start-Modal
  const [startModalVisible, setStartModalVisible] = useState(true);
  const handleStartMusicChoice = (choice) => {
    setMusicEnabled(choice === 'on');
    setStartModalVisible(false);
  };

  // Musikfunktionen
  useEffect(() => {
    playMusic(songIndex);
  }, [songIndex]);
  useEffect(() => {
    if (music) music.setIsMutedAsync(!musicEnabled);
  }, [musicEnabled, music]);
  useEffect(() => {
    if (music) music.setVolumeAsync(volume);
  }, [volume, music]);
  const playMusic = useCallback(
    async (index) => {
      if (music) {
        await music.unloadAsync();
      }
      const { sound: newSound } = await Audio.Sound.createAsync(songs[index].file);
      setMusic(newSound);
      setCurrentSongName(songs[index].name);
      setIsPlaying(true);
      await newSound.playAsync();
      newSound.setOnPlaybackStatusUpdate((status) => {
        if (status.didJustFinish) {
          handleNextSong();
        }
      });
    },
    [music, songs, handleNextSong]
  );

  const songs = [
    { file: Song1, name: 'Song 1' },
    { file: Song2, name: 'Song 2' },
    { file: Song3, name: 'Song 3' }
  ];

  const handleNextSong = useCallback(() => {
    setSongIndex((prevIndex) => (prevIndex + 1) % songs.length);
  }, [songs]);

  const handlePrevSong = useCallback(() => {
    setSongIndex((prevIndex) => (prevIndex - 1 + songs.length) % songs.length);
  }, [songs]);

  const pauseMusic = useCallback(async () => {
    if (music) {
      await music.pauseAsync();
      setIsPlaying(false);
    }
  }, [music]);
  const resumeMusic = useCallback(async () => {
    if (music && musicEnabled) {
      await music.playAsync();
      setIsPlaying(true);
    }
  }, [music, musicEnabled]);
  const toggleSettings = useCallback(
    () => setSettingsVisible((prev) => !prev),
    []
  );
  const toggleMusic = useCallback(() => setMusicEnabled((prev) => !prev), []);
  const toggleSound = useCallback(() => setSoundEnabled((prev) => !prev), []);

  // Slot Machine
  const playSlotSound = useCallback(async () => {
    if (!soundEnabled) return;
    try {
      const { sound } = await Audio.Sound.createAsync(
        require('./assets/SlotSound.wav')
      );
      await sound.playAsync();
      setTimeout(() => sound.unloadAsync(), 1000);
    } catch (error) {
      console.error('SlotSound error:', error);
    }
  }, [soundEnabled]);

  const playWinSound = useCallback(async () => {
    if (!soundEnabled) return;
    try {
      const { sound } = await Audio.Sound.createAsync(
        require('./assets/WinSlot.mp3')
      );
      winSoundRef.current = sound;
      await sound.playAsync();
      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.didJustFinish) {
          sound.unloadAsync();
          winSoundRef.current = null;
        }
      });
    } catch (error) {
      console.error('WinSound error:', error);
    }
  }, [soundEnabled]);

  function playSlotMachine() {
    if (betAmount > money) {
      setSlotResult('Nicht genug Geld!');
      return;
    }
    if (winSoundRef.current) {
      winSoundRef.current.stopAsync();
      winSoundRef.current.unloadAsync();
      winSoundRef.current = null;
    }
    let outcomes = [];
    reelAnim.forEach((anim, index) => {
      Animated.timing(anim, {
        toValue: -fruitHeight * fruitImages.length * 5,
        duration: 3000 + index * 500,
        useNativeDriver: true,
        easing: Easing.linear,
      }).start(() => {
        playSlotSound();
        const outcomeIndex = Math.floor(Math.random() * fruitImages.length);
        outcomes[index] = outcomeIndex;
        Animated.timing(anim, {
          toValue: -fruitHeight * outcomeIndex,
          duration: 500,
          useNativeDriver: true,
          easing: Easing.bounce,
        }).start(() => {
          if (index === reelAnim.length - 1) {
            if (outcomes.every((val) => val === outcomes[0])) {
              const multiplier = multipliers[outcomes[0]];
              const winAmount = betAmount * multiplier;
              setMoney((prev) => prev + winAmount);
              setSlotResult(`Gewonnen: €${winAmount}`);
              playWinSound();
            } else {
              setMoney((prev) => prev - betAmount);
              setSlotResult(`Verloren: €${betAmount}`);
            }
          }
        });
      });
    });
  }

  // Produktion & Verkauf
  useEffect(() => {
    const interval = setInterval(() => {
      // Weed
      setWeed(prev => {
        const newVal = Math.min(prev + plantProductionRate, maxWeed);
        const delta = newVal - prev;
        if (delta > 0) setTotalWeedProduced(total => total + delta);
        return newVal;
      });
      setWeed((prevWeed) => {
        if (prevWeed >= dealers) {
          const sold = dealers;
          setMoney((prevMoney) => prevMoney + sold * dealerSalePrice);
          return prevWeed - sold;
        }
        return prevWeed;
      });
      // Speed
      setSpeed(prev => {
        const newVal = Math.min(prev + speedProductionRate, maxSpeed);
        const delta = newVal - prev;
        if (delta > 0) setTotalSpeedProduced(total => total + delta);
        return newVal;
      });
      // Koks
      setKoks(prev => {
        const newVal = Math.min(prev + koksProductionRate, maxKoks);
        const delta = newVal - prev;
        if (delta > 0) setTotalKoksProduced(total => total + delta);
        return newVal;
      });
    }, 1500);
    return () => clearInterval(interval);
  }, [
    plants,
    dealerUpgrade,
    dealers,
    speedLabs,
    caravanUpgrade,
    koksLabs,
    koksTaxiUpgrade,
    plantProductionRate,
    speedProductionRate,
    koksProductionRate,
    maxWeed,
    maxSpeed,
    maxKoks,
    dealerSalePrice,
  ]);

  useEffect(() => {
    const interval = setInterval(() => {
      setSpeed(prev => {
        if (prev >= caravans) {
          setMoney(prevMoney => prevMoney + caravans * speedSalePrice);
          return prev - caravans;
        }
        return prev;
      });
    }, 1500);
    return () => clearInterval(interval);
  }, [caravans, speedSalePrice]);

  useEffect(() => {
    const interval = setInterval(() => {
      setKoks(prev => {
        if (prev >= koksTaxis) {
          setMoney(prevMoney => prevMoney + koksTaxis * koksSalePrice);
          return prev - koksTaxis;
        }
        return prev;
      });
    }, 1500);
    return () => clearInterval(interval);
  }, [koksTaxis, koksSalePrice]);

  const playLevelUpSound = useCallback(async () => {
    if (!soundEnabled) return;
    const { sound } = await Audio.Sound.createAsync(
      require('./assets/Lvlup.wav')
    );
    await sound.playAsync();
  }, [soundEnabled]);

  const addXp = useCallback(
    (amount) => {
      setXp((prev) => {
        const newXp = prev + amount;
        if (newXp >= level * 100) {
          const bonus = level * 10;
          setLevel((prevLevel) => prevLevel + 1);
          if (soundEnabled) playLevelUpSound();
          setMoney((prevMoney) => prevMoney + bonus);
          setLevelUpBonus(bonus);
          Animated.sequence([
            Animated.timing(levelUpAnim, {
              toValue: 1,
              duration: 300,
              useNativeDriver: true,
            }),
            Animated.timing(levelUpAnim, {
              toValue: 0,
              duration: 1000,
              delay: 500,
              useNativeDriver: true,
            }),
          ]).start();
          return newXp - level * 100;
        }
        return newXp;
      });
    },
    [level, soundEnabled, levelUpAnim]
  );

  // Kaufen-Funktionen – rufen jeweils playBuySound()
  const handleBuyPlant = useCallback(() => {
    if (money >= plantCost) {
      setMoney(money - plantCost);
      setPlants(plants + 1);
      addXp(20);
      playBuySound();
    }
  }, [money, plantCost, plants, addXp, playBuySound]);

  const handleBuyDealer = useCallback(() => {
    if (money >= dealerCost) {
      setMoney(money - dealerCost);
      setDealers(dealers + 1);
      addXp(30);
      playBuySound();
    }
  }, [money, dealerCost, dealers, addXp, playBuySound]);

  const handleBuyCaravan = useCallback(() => {
    if (money >= caravanCost) {
      setMoney(money - caravanCost);
      setCaravans(caravans + 1);
      addXp(20);
      playBuySound();
    }
  }, [money, caravanCost, caravans, addXp, playBuySound]);

  const handleBuySpeedLab = useCallback(() => {
    if (money >= speedLabCost) {
      setMoney(money - speedLabCost);
      setSpeedLabs(speedLabs + 1);
      addXp(20);
      playBuySound();
    }
  }, [money, speedLabCost, speedLabs, addXp, playBuySound]);

  const handleBuyKoksLab = useCallback(() => {
    if (money >= koksLaborCost) {
      setMoney(money - koksLaborCost);
      setKoksLabs((prev) => prev + 1);
      addXp(20);
      playBuySound();
    }
  }, [money, koksLaborCost, addXp, playBuySound]);

  const handleBuyKoksTaxi = useCallback(() => {
    if (money >= koksTaxiCost) {
      setMoney(money - koksTaxiCost);
      setKoksTaxis((prev) => prev + 1);
      addXp(30);
      playBuySound();
    }
  }, [money, koksTaxiCost, addXp, playBuySound]);

  const handleWeedUpgrade = useCallback(() => {
    if (money >= weedUpgradeCost) {
      setMoney(money - weedUpgradeCost);
      setWeedUpgrade(weedUpgrade + 1);
      addXp(50);
      playBuySound();
      setSaleRates(prev => ({ ...prev, weed: prev.weed + 1 }));
    }
  }, [money, weedUpgradeCost, weedUpgrade, addXp, playBuySound]);

  const handleDealerUpgrade = useCallback(() => {
    if (money >= dealerUpgradeCost) {
      setMoney(money - dealerUpgradeCost);
      setDealerUpgrade(dealerUpgrade + 1);
      addXp(50);
      playBuySound();
    }
  }, [money, dealerUpgradeCost, dealerUpgrade, addXp, playBuySound]);

  const handleSpeedUpgrade = useCallback(() => {
    if (money >= speedUpgradeCost) {
      setMoney(money - speedUpgradeCost);
      setSpeedUpgrade(speedUpgrade + 1);
      addXp(50);
      playBuySound();
      setSaleRates(prev => ({ ...prev, speed: prev.speed + 1 }));
    }
  }, [money, speedUpgradeCost, speedUpgrade, addXp, playBuySound]);

  const handleCaravanUpgrade = useCallback(() => {
    if (money >= caravanUpgradeCost) {
      setMoney(money - caravanUpgradeCost);
      setCaravanUpgrade(caravanUpgrade + 1);
      addXp(50);
      playBuySound();
    }
  }, [money, caravanUpgradeCost, caravanUpgrade, addXp, playBuySound]);

  const handleKoksUpgrade = useCallback(() => {
    if (money >= koksUpgradeCost) {
      setMoney(money - koksUpgradeCost);
      setKoksUpgrade((prev) => prev + 1);
      addXp(50);
      playBuySound();
      setSaleRates(prev => ({ ...prev, koks: prev.koks + 1 }));
    }
  }, [money, koksUpgradeCost, addXp, playBuySound]);

  const handleKoksTaxiUpgrade = useCallback(() => {
    if (money >= koksTaxiUpgradeCost) {
      setMoney(money - koksTaxiUpgradeCost);
      setKoksTaxiUpgrade((prev) => prev + 1);
      addXp(50);
      playBuySound();
    }
  }, [money, koksTaxiUpgradeCost, addXp, playBuySound]);

  // Daily Quest Timer
  const [dailyQuests, setDailyQuests] = useState(getDailyQuests());
  const [questsResetTime, setQuestsResetTime] = useState(new Date(Date.now() + 24 * 60 * 60 * 1000));
  const [timeUntilReset, setTimeUntilReset] = useState(formatTime(questsResetTime - new Date()));
  const [questModalVisible, setQuestModalVisible] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      const nextReset = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate() + 1
      );
      const diff = nextReset - now;
      setTimeUntilReset(formatTime(diff));
      if (diff <= 0) {
        setDailyQuests(getDailyQuests());
      }
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (questsResetTime && currentTime >= questsResetTime) {
      setDailyQuests(getDailyQuests());
      setQuestsResetTime(null);
    }
  }, [currentTime, questsResetTime]);

  // Update daily quest progress based on game state
  useEffect(() => {
    setDailyQuests((prev) =>
      prev.map((q) => {
        const goal = parseInt(q.description.match(/(\d+)/)?.[1] || '0');
        let prog = q.progress;
        if (q.description.includes('Level')) {
          prog = Math.min(Math.floor((level / goal) * 100), 100);
        } else if (q.description.includes('Verdiene') || q.description.includes('Gewinn')) {
          prog = Math.min(Math.floor((money / goal) * 100), 100);
        } else if (q.description.includes('Pflanzen')) {
          prog = Math.min(Math.floor((plants / goal) * 100), 100);
        } else if (q.description.includes('Dealer') && !q.description.includes('Upgrade')) {
          prog = Math.min(Math.floor((dealers / goal) * 100), 100);
        } else if (q.description.includes('Weed Upgrade')) {
          prog = Math.min(Math.floor((weedUpgrade / goal) * 100), 100);
        } else if (q.description.includes('Speed um')) {
          prog = Math.min(Math.floor((speed / goal) * 100), 100);
        } else if (q.description.includes('Upgrades insgesamt')) {
          const totalUpgrades = weedUpgrade + dealerUpgrade + speedUpgrade + caravanUpgrade + koksUpgrade + koksTaxiUpgrade;
          prog = Math.min(Math.floor((totalUpgrades / goal) * 100), 100);
        } else if (q.description.includes('Speed Labors')) {
          prog = Math.min(Math.floor((speedLabs / goal) * 100), 100);
        } else if (q.description.includes('Wohnwagen')) {
          prog = Math.min(Math.floor((caravans / goal) * 100), 100);
        }
        return { ...q, progress: prog };
      })
    );
  }, [
    level,
    money,
    plants,
    dealers,
    speed,
    weedUpgrade,
    dealerUpgrade,
    speedUpgrade,
    caravanUpgrade,
    koksUpgrade,
    koksTaxiUpgrade,
    speedLabs,
    caravans,
  ]);

  // Akku & Zeit fürs Handy-Menü
  useEffect(() => {
    if (phoneMenuVisible) {
      Battery.getBatteryLevelAsync().then((lvl) =>
        setBatteryLevel(Math.round(lvl * 100))
      );
      const timeInterval = setInterval(() => setCurrentTime(new Date()), 1000);
      return () => clearInterval(timeInterval);
    }
  }, [phoneMenuVisible]);

  useEffect(() => {
    Asset.loadAsync(require('./assets/matrix.png'));
  }, []);

  const achievementsByCategory = {
    Drogen: drogenAchievements,
    Dealer: dealerAchievements,
    Upgrades: upgradeAchievements,
  };

  return (
    <View style={styles.container}>
      {/* Start-Modal */}
      <Modal visible={startModalVisible} transparent>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.settingsTitle}>Musik aktivieren?</Text>
            <TouchableOpacity
              style={styles.button}
              onPress={() => handleStartMusicChoice('on')}
            >
              <Text style={styles.buttonText}>Musik AN</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.button}
              onPress={() => handleStartMusicChoice('off')}
            >
              <Text style={styles.buttonText}>Musik AUS</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Level-Up Overlay */}
      <Animated.View
        style={[styles.levelUpContainer, { opacity: levelUpAnim }]}
      >
        <Text style={styles.levelUpText}>Level Up! Bonus: {levelUpBonus}€</Text>
      </Animated.View>

      {/* Titelzeile */}
      <View style={styles.titleContainer}>
        <View style={styles.leftIconsContainer}>
          <TouchableOpacity onPress={() => setShopModalVisible(true)} style={styles.shopIcon}>
            <Image source={require('./assets/store.png')} style={[styles.icon, {marginTop: 2}]} />
          </TouchableOpacity>
        </View>
        <Image source={require('./assets/Titelbild.png')} style={styles.titleImage} />
        <View style={styles.rightIconsContainer}>
          <TouchableOpacity onPress={() => setSettingsVisible(true)}>
            <Image source={require('./assets/gear.png')} style={[styles.icon, {marginTop: 2}]} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setPhoneMenuVisible(true)} style={styles.rightIconSpacing}>
            <Image source={require('./assets/phone.png')} style={[styles.icon, {marginTop: 2}]} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Hauptinhalt */}
      <ScrollView contentContainerStyle={styles.scrollViewContainer}>
        {/* Geld & XP */}
        <View style={styles.moneyLevelContainer}>
          <View style={styles.currencyWrapper}>
            <View style={[styles.moneyContainer, {marginBottom: 6}]}>
              <Image source={require('./assets/money.png')} style={styles.icon} />
              <Text style={styles.stat}>{money}€</Text>
            </View>
            <View style={styles.moneyContainer}>
              <Image source={require('./assets/BTC.png')} style={styles.icon} />
              <Text style={styles.stat}>{btc.toFixed(4)}</Text>
            </View>
          </View>
          <View style={styles.xpContainer}>
            <Text style={styles.xpText}>{currentRank}</Text>
            <View style={styles.xpBar}>
              <View style={[styles.xpFill, { width: `${(xp / (level * 100)) * 100}%` }]} />
            </View>
            <Text style={styles.stat}>Level: {level}</Text>
          </View>
        </View>

        {/* Kategorien (Drogen, Dealer, Upgrades) */}
        <View style={styles.categoryContainer}>
          <TouchableOpacity onPress={() => setShowDrogen(v => !v)}>
            <Text style={styles.categoryTitle}>Drogen</Text>
          </TouchableOpacity>
          {showDrogen && (
            <View style={styles.categoryContent}>
              <View style={{ borderBottomWidth: 1, borderBottomColor: '#fff', marginVertical: 5 }} />

              <View style={styles.itemRow}>
                <View style={styles.itemRowLeft}>
                  <Image source={require('./assets/weed.png')} style={styles.itemIcon} />
                  <Text style={styles.itemName}>Weed: {weed.toFixed(1)}g / {maxWeed}g</Text>
                </View>
              </View>

              <View style={styles.itemRow}>
                <View style={styles.itemRowLeft}>
                  <Image source={require('./assets/Pflanze.png')} style={styles.itemIcon} />
                  <Text style={styles.itemName}>Pflanzen: {plants}</Text>
                </View>
                <TouchableOpacity style={[styles.upgradeCostButton, { marginLeft: 'auto' }]} onPress={handleBuyPlant}>
                  <Text style={styles.upgradeButtonText}>{plantCost}€</Text>
                </TouchableOpacity>
              </View>
              <View style={{ borderBottomWidth: 1, borderBottomColor: '#fff', marginVertical: 5 }} />

              <TouchableOpacity
                style={[styles.itemRow, level < 3 && styles.buttonDisabled]}
                disabled={level < 3}
                onPress={() => { if (level < 3) Alert.alert('Speed freigeschaltet ab Level 3'); }}
              >
                <View style={styles.itemRowLeft}>
                  <Image source={require('./assets/speed.png')} style={styles.itemIcon} />
                  <Text style={styles.itemName}>Speed: {speed.toFixed(1)}g / {maxSpeed}g</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.itemRow, level < 5 && styles.buttonDisabled]}
                disabled={level < 5}
                onPress={() => { if (level < 5) Alert.alert('Speed-Labor freigeschaltet ab Level 5'); else handleBuySpeedLab(); }}
              >
                <View style={styles.itemRowLeft}>
                  <Image source={require('./assets/Kuche.png')} style={styles.itemIcon} />
                  <Text style={styles.itemName}>Speed-Labor: {speedLabs}</Text>
                </View>
                <TouchableOpacity
                  style={[styles.upgradeCostButton, level < 5 && styles.buttonDisabled, { marginLeft: 'auto' }]}
                  disabled={level < 5}
                  onPress={() => { if (level < 5) Alert.alert('Speed-Labor freigeschaltet ab Level 5'); else handleBuySpeedLab(); }}
                >
                  <Text style={styles.upgradeButtonText}>{speedLabCost}€</Text>
                </TouchableOpacity>
              </TouchableOpacity>
              <View style={{ borderBottomWidth: 1, borderBottomColor: '#fff', marginVertical: 5 }} />

              <TouchableOpacity
                style={[styles.itemRow, level < 7 && styles.buttonDisabled]}
                disabled={level < 7}
                onPress={() => { if (level < 7) Alert.alert('Koks freigeschaltet ab Level 7'); }}
              >
                <View style={styles.itemRowLeft}>
                  <Image source={require('./assets/koks.png')} style={styles.itemIcon} />
                  <Text style={styles.itemName}>Koks: {koks.toFixed(1)}g / {maxKoks}g</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.itemRow, level < 9 && styles.buttonDisabled]}
                disabled={level < 9}
                onPress={() => { if (level < 9) Alert.alert('Koks-Labor freigeschaltet ab Level 9'); else handleBuyKoksLab(); }}
              >
                <View style={styles.itemRowLeft}>
                  <Image source={require('./assets/Kokslabor.png')} style={styles.itemIcon} />
                  <Text style={styles.itemName}>Koks-Labor: {koksLabs}</Text>
                </View>
                <TouchableOpacity
                  style={[styles.upgradeCostButton, level < 9 && styles.buttonDisabled, { marginLeft: 'auto' }]}
                  disabled={level < 9}
                  onPress={() => { if (level < 9) Alert.alert('Koks-Labor freigeschaltet ab Level 9'); else handleBuyKoksLab(); }}
                >
                  <Text style={styles.upgradeButtonText}>{koksLaborCost}€</Text>
                </TouchableOpacity>
              </TouchableOpacity>
              <View style={{ borderBottomWidth: 1, borderBottomColor: '#fff', marginVertical: 5 }} />
            </View>
          )}
        </View>
        <View style={styles.categoryContainer}>
          <TouchableOpacity onPress={() => setShowDealer(v => !v)}>
            <Text style={styles.categoryTitle}>Dealer</Text>
          </TouchableOpacity>
          {showDealer && (
            <View style={styles.categoryContent}>
              <View style={{ borderBottomWidth: 1, borderBottomColor: '#fff', marginVertical: 5 }} />

              <View style={styles.itemRow}>
                <View style={styles.itemRowLeft}>
                  <Image source={require('./assets/dealer.png')} style={styles.itemIcon} />
                  <Text style={styles.itemName}>Dealer: {dealers}</Text>
                </View>
                <TouchableOpacity style={[styles.upgradeCostButton, { marginLeft: 'auto' }]} onPress={handleBuyDealer}>
                  <Text style={styles.upgradeButtonText}>{dealerCost}€</Text>
                </TouchableOpacity>
              </View>
              <View style={{ borderBottomWidth: 1, borderBottomColor: '#fff', marginVertical: 5 }} />

              <TouchableOpacity
                style={[styles.itemRow, level < 5 && styles.buttonDisabled]}
                disabled={level < 5}
                onPress={() => { if (level < 5) Alert.alert('Camper freigeschaltet ab Level 5'); else handleBuyCaravan(); }}
              >
                <View style={styles.itemRowLeft}>
                  <Image source={require('./assets/caravan.png')} style={styles.itemIcon} />
                  <Text style={styles.itemName}>Camper: {caravans}</Text>
                </View>
                <TouchableOpacity
                  style={[styles.upgradeCostButton, level < 5 && styles.buttonDisabled, { marginLeft: 'auto' }]}
                  disabled={level < 5}
                  onPress={() => { if (level < 5) Alert.alert('Camper freigeschaltet ab Level 5'); else handleBuyCaravan(); }}
                >
                  <Text style={styles.upgradeButtonText}>{caravanCost}€</Text>
                </TouchableOpacity>
              </TouchableOpacity>
              <View style={{ borderBottomWidth: 1, borderBottomColor: '#fff', marginVertical: 5 }} />

              <TouchableOpacity
                style={[styles.itemRow, level < 9 && styles.buttonDisabled]}
                disabled={level < 9}
                onPress={() => { if (level < 9) Alert.alert('Koks-Taxi freigeschaltet ab Level 9'); else handleBuyKoksTaxi(); }}
              >
                <View style={styles.itemRowLeft}>
                  <Image source={require('./assets/car.png')} style={styles.itemIcon} />
                  <Text style={styles.itemName}>Koks-Taxi: {koksTaxis}</Text>
                </View>
                <TouchableOpacity
                  style={[styles.upgradeCostButton, level < 9 && styles.buttonDisabled, { marginLeft: 'auto' }]}
                  disabled={level < 9}
                  onPress={() => { if (level < 9) Alert.alert('Koks-Taxi freigeschaltet ab Level 9'); else handleBuyKoksTaxi(); }}
                >
                  <Text style={styles.upgradeButtonText}>{koksTaxiCost}€</Text>
                </TouchableOpacity>
              </TouchableOpacity>
              <View style={{ borderBottomWidth: 1, borderBottomColor: '#fff', marginVertical: 5 }} />
            </View>
          )}
        </View>
        <View style={styles.categoryContainer}>
          <TouchableOpacity onPress={() => setShowUpgrades(v => !v)}>
            <Text style={styles.categoryTitle}>Upgrades</Text>
          </TouchableOpacity>
          {showUpgrades && (
            <View style={styles.categoryContent}>
              <View style={{ borderBottomWidth: 1, borderBottomColor: '#fff', marginVertical: 5 }} />

              <View style={styles.itemRow}>
                <View style={styles.itemRowLeft}>
                  <Image source={require('./assets/weed.png')} style={styles.itemIcon} />
                  <Text style={styles.itemName}>Weed</Text>
                </View>
                <TouchableOpacity style={[styles.upgradeCostButton, { marginLeft: 'auto' }]} onPress={handleWeedUpgrade}>
                  <Text style={styles.upgradeButtonText}>{weedUpgradeCost}€</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.itemRow}>
                <View style={styles.itemRowLeft}>
                  <Image source={require('./assets/Pflanze.png')} style={styles.itemIcon} />
                  <Text style={styles.itemName}>Pflanzen</Text>
                </View>
                <TouchableOpacity style={[styles.upgradeCostButton, { marginLeft: 'auto' }]} onPress={handleDealerUpgrade}>
                  <Text style={styles.upgradeButtonText}>{dealerUpgradeCost}€</Text>
                </TouchableOpacity>
              </View>
              <View style={{ borderBottomWidth: 1, borderBottomColor: '#fff', marginVertical: 5 }} />

              <TouchableOpacity
                style={[styles.itemRow, level < 3 && styles.buttonDisabled]}
                disabled={level < 3}
                onPress={() => { if (level < 3) Alert.alert('Speed freigeschaltet ab Level 3'); else handleSpeedUpgrade(); }}
              >
                <View style={styles.itemRowLeft}>
                  <Image source={require('./assets/speed.png')} style={styles.itemIcon} />
                  <Text style={styles.itemName}>Speed</Text>
                </View>
                <TouchableOpacity
                  style={[styles.upgradeCostButton, level < 3 && styles.buttonDisabled, { marginLeft: 'auto' }]}
                  disabled={level < 3}
                  onPress={() => { if (level < 3) Alert.alert('Speed freigeschaltet ab Level 3'); else handleSpeedUpgrade(); }}
                >
                  <Text style={styles.upgradeButtonText}>{speedUpgradeCost}€</Text>
                </TouchableOpacity>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.itemRow, level < 5 && styles.buttonDisabled]}
                disabled={level < 5}
                onPress={() => { if (level < 5) Alert.alert('Speed-Labor freigeschaltet ab Level 5'); else handleCaravanUpgrade(); }}
              >
                <View style={styles.itemRowLeft}>
                  <Image source={require('./assets/Kuche.png')} style={styles.itemIcon} />
                  <Text style={styles.itemName}>Speed-Labor</Text>
                </View>
                <TouchableOpacity
                  style={[styles.upgradeCostButton, level < 5 && styles.buttonDisabled, { marginLeft: 'auto' }]}
                  disabled={level < 5}
                  onPress={() => { if (level < 5) Alert.alert('Speed-Labor freigeschaltet ab Level 5'); else handleCaravanUpgrade(); }}
                >
                  <Text style={styles.upgradeButtonText}>{caravanUpgradeCost}€</Text>
                </TouchableOpacity>
              </TouchableOpacity>
              <View style={{ borderBottomWidth: 1, borderBottomColor: '#fff', marginVertical: 5 }} />

              <TouchableOpacity
                style={[styles.itemRow, level < 7 && styles.buttonDisabled]}
                disabled={level < 7}
                onPress={() => { if (level < 7) Alert.alert('Koks freigeschaltet ab Level 7'); else handleKoksUpgrade(); }}
              >
                <View style={styles.itemRowLeft}>
                  <Image source={require('./assets/koks.png')} style={styles.itemIcon} />
                  <Text style={styles.itemName}>Koks</Text>
                </View>
                <TouchableOpacity
                  style={[styles.upgradeCostButton, level < 7 && styles.buttonDisabled, { marginLeft: 'auto' }]}
                  disabled={level < 7}
                  onPress={() => { if (level < 7) Alert.alert('Koks freigeschaltet ab Level 7'); else handleKoksUpgrade(); }}
                >
                  <Text style={styles.upgradeButtonText}>{koksUpgradeCost}€</Text>
                </TouchableOpacity>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.itemRow, level < 9 && styles.buttonDisabled]}
                disabled={level < 9}
                onPress={() => { if (level < 9) Alert.alert('Koks-Labor freigeschaltet ab Level 9'); else handleKoksTaxiUpgrade(); }}
              >
                <View style={styles.itemRowLeft}>
                  <Image source={require('./assets/Kokslabor.png')} style={styles.itemIcon} />
                  <Text style={styles.itemName}>Koks-Labor</Text>
                </View>
                <TouchableOpacity
                  style={[styles.upgradeCostButton, level < 9 && styles.buttonDisabled, { marginLeft: 'auto' }]}
                  disabled={level < 9}
                  onPress={() => { if (level < 9) Alert.alert('Koks-Labor freigeschaltet ab Level 9'); else handleKoksTaxiUpgrade(); }}
                >
                  <Text style={styles.upgradeButtonText}>{koksTaxiUpgradeCost}€</Text>
                </TouchableOpacity>
              </TouchableOpacity>
              <View style={{ borderBottomWidth: 1, borderBottomColor: '#fff', marginVertical: 5 }} />
            </View>
          )}
        </View>
      </ScrollView>

      {/* Modals (Settings, Quests, Achievements, Slot Machine, Shop, Phone) */}
      <Modal visible={settingsVisible} animationType="slide" transparent>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.settingsTitle}>Einstellungen</Text>
            <Text style={styles.settingLabel}>Lautstärke</Text>
            <Slider
              style={styles.slider}
              minimumValue={0}
              maximumValue={1}
              value={volume}
              onValueChange={setVolume}
              minimumTrackTintColor="#FFD700"
              maximumTrackTintColor="#fff"
            />
            <Text style={styles.settingLabel}>Sound Effekte</Text>
            <TouchableOpacity style={styles.button} onPress={toggleSound}>
              <Text style={styles.buttonText}>Sound: {soundEnabled ? 'AN' : 'AUS'}</Text>
            </TouchableOpacity>
            <Text style={styles.settingLabel}>Musik</Text>
            <TouchableOpacity style={styles.button} onPress={toggleMusic}>
              <Text style={styles.buttonText}>Musik: {musicEnabled ? 'AN' : 'AUS'}</Text>
            </TouchableOpacity>
            <View style={styles.playerContainer}>
              <Text style={styles.playerSongTitle}>{currentSongName}</Text>
              <View style={styles.playerControls}>
                <TouchableOpacity onPress={handlePrevSong} style={styles.playerButton}>
                  <Text style={styles.playerButtonText}>⏮</Text>
                </TouchableOpacity>
                {isPlaying ? (
                  <TouchableOpacity onPress={pauseMusic} style={styles.playerButton}>
                    <Text style={styles.playerButtonText}>⏸</Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity onPress={resumeMusic} style={styles.playerButton}>
                    <Text style={styles.playerButtonText}>▶</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity onPress={handleNextSong} style={styles.playerButton}>
                  <Text style={styles.playerButtonText}>⏭</Text>
                </TouchableOpacity>
              </View>
            </View>
            <TouchableOpacity style={styles.button} onPress={toggleSettings}>
              <Text style={styles.buttonText}>Schließen</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      <Modal visible={questModalVisible} animationType="slide" transparent>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.settingsTitle}>Tägliche Aufgaben</Text>
            {questsResetTime && (
              <Text style={styles.timerText}>
                {formatTime(questsResetTime - currentTime)}
              </Text>
            )}
            {dailyQuests.map((quest) => (
              <View key={quest.id} style={styles.questLine}>
                <View style={styles.questDescriptionContainer}>
                  <Text style={styles.questDescription}>{quest.description}</Text>
                </View>
                <View style={styles.questProgressContainer}>
                  <Text style={styles.questProgressText}>{quest.progress}%</Text>
                </View>
                <TouchableOpacity
                  style={[
                    styles.button,
                    (quest.progress < quest.target || quest.completed) &&
                      styles.buttonDisabled,
                    { marginLeft: 'auto' },
                  ]}
                  disabled={quest.progress < quest.target || quest.completed}
                  onPress={() => {
                    setMoney((prev) => prev + quest.reward);
                    setDailyQuests((prev) => {
                      const updated = prev.map((q) =>
                        q.id === quest.id
                          ? { ...q, completed: true, progress: 100 }
                          : q
                      );
                      if (updated.every((q) => q.completed)) {
                        setQuestsResetTime(Date.now() + 12 * 3600 * 1000);
                      }
                      return updated;
                    });
                  }}
                >
                  <Text style={[styles.buttonText, styles.questButtonTextSmall]}>{quest.reward}€</Text>
                </TouchableOpacity>
              </View>
            ))}
            <TouchableOpacity style={styles.button} onPress={() => setQuestModalVisible(false)}>
              <Text style={styles.buttonText}>Schließen</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      <Modal visible={achievementModalVisible} animationType="slide" transparent>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.settingsTitle}>Achievements</Text>
            <ScrollView style={{ width: '100%', maxHeight: 300 }} contentContainerStyle={styles.scrollViewContainer} showsVerticalScrollIndicator>
              <TouchableOpacity style={styles.categoryButton} onPress={() => setShowDrogenAchievements(v => !v)}>
                <Text style={[styles.categoryButtonText, styles.smallText]}>Drogen</Text>
              </TouchableOpacity>
              {showDrogenAchievements && drogenAchievements.map(a => (
                <View key={a.id} style={styles.questLine}>
                  <View style={styles.questDescriptionContainer}>
                    <Text style={styles.questDescription}>{a.description}</Text>
                  </View>
                  <View style={styles.questProgressContainer}>
                    <Text style={styles.questProgressText}>{a.progress}%</Text>
                  </View>
                  <TouchableOpacity
                    style={[styles.button, a.progress < 100 && styles.buttonDisabled, { marginLeft: 'auto' }]}
                    disabled={a.progress < 100}
                    onPress={() => {
                      setMoney(prev => prev + drogenCollectAmount);
                      setDrogenCollectAmount(prev => prev + 500);
                    }}
                  >
                    <Text style={[styles.buttonText, styles.questButtonTextSmall]}>{drogenCollectAmount}€</Text>
                  </TouchableOpacity>
                </View>
              ))}
              <TouchableOpacity style={styles.categoryButton} onPress={() => setShowDealerAchievements(v => !v)}>
                <Text style={[styles.categoryButtonText, styles.smallText]}>Dealer</Text>
              </TouchableOpacity>
              {showDealerAchievements && dealerAchievements.map(a => (
                <View key={a.id} style={styles.questLine}>
                  <View style={styles.questDescriptionContainer}>
                    <Text style={styles.questDescription}>{a.description}</Text>
                  </View>
                  <View style={styles.questProgressContainer}>
                    <Text style={styles.questProgressText}>{a.progress}%</Text>
                  </View>
                  <TouchableOpacity
                    style={[styles.button, a.progress < 100 && styles.buttonDisabled, { marginLeft: 'auto' }]}
                    disabled={a.progress < 100}
                    onPress={() => {
                      setMoney(prev => prev + dealerCollectAmount);
                      setDealerCollectAmount(prev => prev + 500);
                    }}
                  >
                    <Text style={[styles.buttonText, styles.questButtonTextSmall]}>{dealerCollectAmount}€</Text>
                  </TouchableOpacity>
                </View>
              ))}
              <TouchableOpacity style={styles.categoryButton} onPress={() => setShowUpgradesAchievements(v => !v)}>
                <Text style={[styles.categoryButtonText, styles.smallText]}>Upgrades</Text>
              </TouchableOpacity>
              {showUpgradesAchievements && upgradeAchievements.map(a => (
                <View key={a.id} style={styles.questLine}>
                  <View style={styles.questDescriptionContainer}>
                    <Text style={styles.questDescription}>{a.description}</Text>
                  </View>
                  <View style={styles.questProgressContainer}>
                    <Text style={styles.questProgressText}>{a.progress}%</Text>
                  </View>
                  <TouchableOpacity
                    style={[styles.button, a.progress < 100 && styles.buttonDisabled, { marginLeft: 'auto' }]}
                    disabled={a.progress < 100}
                    onPress={() => {
                      setMoney(prev => prev + upgradeCollectAmount);
                      setUpgradeCollectAmount(prev => prev + 500);
                    }}
                  >
                    <Text style={[styles.buttonText, styles.questButtonTextSmall]}>{upgradeCollectAmount}€</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>
            <TouchableOpacity style={styles.button} onPress={() => setAchievementModalVisible(false)}>
              <Text style={styles.buttonText}>Schließen</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      <Modal visible={slotModalVisible} animationType="slide" transparent>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Image source={require('./assets/777.png')} style={styles.slotHeaderImage} />
            <Text style={[styles.stat, {marginVertical: 5}]}>Geld: {money}€</Text>
            <View style={styles.slotMachineContainer}>
              {[0,1,2].map((_, reelIndex) => (
                <View key={reelIndex} style={styles.reelContainer}>
                  <Animated.View style={{ transform: [{ translateY: reelAnim[reelIndex] }] }}>
                    {Array(6)
                      .fill(null)
                      .map((_, cycleIdx) =>
                        fruitImages.map((img, idx) => (
                          <Image key={`${cycleIdx}-${idx}`} source={img} style={styles.fruitImage} />
                        ))
                      )}
                  </Animated.View>
                </View>
              ))}
            </View>
            <View style={styles.slotBetContainer}>
              <TouchableOpacity style={styles.slotSquareButton} onPress={() => setBetAmount((prev) => Math.max(prev - 1, 0))}>
                <Text style={styles.slotSquareText}>-</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.slotRectButton} onPress={() => setBetAmount((prev) => Math.max(prev - 5, 0))}>
                <Text style={styles.slotRectText}>-5</Text>
              </TouchableOpacity>
              <Text style={styles.slotBetText}>{betAmount}€</Text>
              <TouchableOpacity style={styles.slotRectButton} onPress={() => setBetAmount((prev) => prev + 5)}>
                <Text style={styles.slotRectText}>+5</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.slotSquareButton} onPress={() => setBetAmount((prev) => prev + 1)}>
                <Text style={styles.slotSquareText}>+</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.slotResultText}>{slotResult}</Text>
            <View style={styles.slotActionsContainer}>
              <TouchableOpacity
                style={styles.slotSpinButton}
                onPress={playSlotMachine}
              >
                <Text style={styles.slotSpinButtonText}>Spielen</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.autoSpinButton}
                onPress={() => setAutoSpin(prev => !prev)}
              >
                <Text style={styles.autoSpinButtonText}>
                  {autoSpin ? 'Stop Auto-Spin' : 'Auto-Spin'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.closeSlotButton}
                onPress={() => setSlotModalVisible(false)}
              >
                <Text style={styles.closeSlotButtonText}>Schließen</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      <Modal visible={cryptoModalVisible} animationType="slide" transparent>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.settingsTitle}>Crypto Mining</Text>
            <Text style={styles.stat}>BTC: {btc.toFixed(4)}</Text>
            <View style={{ width: '100%' }}>
              <View style={styles.itemRowNoLine}>
                <Text style={styles.itemName}>Basic Miner: {basicMiners}</Text>
                <TouchableOpacity style={styles.upgradeCostButton} onPress={() => {
                  if (money < 20000) { Alert.alert('Nicht genug Geld'); } else { setMoney(prev => prev - 20000); setBasicMiners(prev => prev + 1); }
                }}>
                  <Text style={styles.upgradeButtonText}>20.000€</Text>
                </TouchableOpacity>
              </View>
              <ScrollView style={styles.terminal} contentContainerStyle={{ padding: 5 }}>
                {basicLogs.map((log, i) => <Text key={i} style={styles.terminalText}>{log}</Text>)}
              </ScrollView>
              <View style={styles.itemRowNoLine}>
                <Text style={styles.itemName}>Pro Miner: {proMiners}</Text>
                <TouchableOpacity style={styles.upgradeCostButton} onPress={() => {
                  if (money < 50000) { Alert.alert('Nicht genug Geld'); } else { setMoney(prev => prev - 50000); setProMiners(prev => prev + 1); }
                }}>
                  <Text style={styles.upgradeButtonText}>50.000€</Text>
                </TouchableOpacity>
              </View>
              <ScrollView style={styles.terminal} contentContainerStyle={{ padding: 5 }}>
                {proLogs.map((log, i) => <Text key={i} style={styles.terminalText}>{log}</Text>)}
              </ScrollView>
              <View style={styles.itemRowNoLine}>
                <Text style={styles.itemName}>Nuclear Rig: {nuclearRigs}</Text>
                <TouchableOpacity style={styles.upgradeCostButton} onPress={() => {
                  if (money < 100000) { Alert.alert('Nicht genug Geld'); } else { setMoney(prev => prev - 100000); setNuclearRigs(prev => prev + 1); }
                }}>
                  <Text style={styles.upgradeButtonText}>100.000€</Text>
                </TouchableOpacity>
              </View>
              <ScrollView style={styles.terminal} contentContainerStyle={{ padding: 5 }}>
                {nuclearLogs.map((log, i) => <Text key={i} style={styles.terminalText}>{log}</Text>)}
              </ScrollView>
            </View>
            <TouchableOpacity style={styles.closeSlotButton} onPress={() => setCryptoModalVisible(false)}>
              <Text style={styles.closeSlotButtonText}>Schließen</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      <Modal visible={shopModalVisible} animationType="slide" transparent>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.settingsTitle}>Shop</Text>
            <TouchableOpacity style={styles.categoryButton} onPress={() => setShowLebensmittel(v => !v)}>
              <Text style={styles.categoryButtonText}>Lebensmittel</Text>
            </TouchableOpacity>
            {showLebensmittel && shopItems.Lebensmittel.map((item, index) => (
              <View key={index} style={styles.itemRowNoLine}>
                <View style={styles.itemRowLeft}>
                  <Image source={item.icon} style={styles.itemIcon} />
                  <Text style={styles.itemName}>{item.name}</Text>
                </View>
                <TouchableOpacity
                  style={styles.upgradeCostButton}
                  onPress={() => handleBuyShopItem('Lebensmittel', index)}
                >
                  <Text style={styles.upgradeButtonText}>{item.price}€</Text>
                </TouchableOpacity>
              </View>
            ))}
            <TouchableOpacity style={styles.categoryButton} onPress={() => setShowWaffen(v => !v)}>
              <Text style={styles.categoryButtonText}>Waffen</Text>
            </TouchableOpacity>
            {showWaffen && shopItems.Waffen.map((item, index) => (
              <View key={index} style={styles.itemRowNoLine}>
                <View style={styles.itemRowLeft}>
                  <Image source={item.icon} style={styles.itemIcon} />
                  <Text style={styles.itemName}>{item.name}</Text>
                </View>
                <TouchableOpacity
                  style={styles.upgradeCostButton}
                  onPress={() => handleBuyShopItem('Waffen', index)}
                >
                  <Text style={styles.upgradeButtonText}>{item.price}€</Text>
                </TouchableOpacity>
              </View>
            ))}
            <TouchableOpacity style={styles.categoryButton} onPress={() => setShowDuenger(v => !v)}>
              <Text style={styles.categoryButtonText}>Dünger & Streckmittel</Text>
            </TouchableOpacity>
            {showDuenger && shopItems['Dünger & Streckmittel'].map((item, index) => (
              <View key={index} style={styles.itemRowNoLine}>
                <View style={styles.itemRowLeft}>
                  <Image source={item.icon} style={styles.itemIcon} />
                  <Text style={styles.itemName}>{item.name}</Text>
                </View>
                <TouchableOpacity
                  style={styles.upgradeCostButton}
                  onPress={() => handleBuyShopItem('Dünger & Streckmittel', index)}
                >
                  <Text style={styles.upgradeButtonText}>{item.price}€</Text>
                </TouchableOpacity>
              </View>
            ))}
            <TouchableOpacity style={styles.closeSlotButton} onPress={() => setShopModalVisible(false)}>
              <Text style={styles.closeSlotButtonText}>Schließen</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      <Modal visible={phoneMenuVisible} animationType="fade" transparent>
        <View style={styles.phoneModalContainer}>
          <View style={styles.phoneDevice}>
            <View style={styles.phoneIconsContainer}>
              <View style={styles.phoneIconsRow}>
                <TouchableOpacity style={styles.phoneAppIcon} onPress={() => { setPhoneMenuVisible(false); setAchievementModalVisible(true); }}>
                  <Image source={require('./assets/Pokal.png')} style={styles.phoneAppImage} />
                </TouchableOpacity>
                <TouchableOpacity style={styles.phoneAppIcon} onPress={() => { setPhoneMenuVisible(false); setQuestModalVisible(true); }}>
                  <Image source={require('./assets/quest.png')} style={styles.phoneAppImage} />
                </TouchableOpacity>
                <TouchableOpacity style={styles.phoneAppIcon} onPress={() => { setPhoneMenuVisible(false); setSlotModalVisible(true); }}>
                  <Image source={require('./assets/slot.png')} style={styles.phoneAppImage} />
                </TouchableOpacity>
              </View>
              <View style={styles.phoneIconsRow}>
                <TouchableOpacity
                  style={[styles.phoneAppIcon, level < 12 && styles.buttonDisabled]}
                  disabled={level < 12}
                  onPress={() => {
                    if (level < 12) Alert.alert('Crypto-App freigeschaltet ab Level 12');
                    else { setPhoneMenuVisible(false); setCryptoModalVisible(true); }
                  }}
                >
                  <Image source={require('./assets/crypto.png')} style={styles.phoneAppImage} />
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.phoneAppIcon, level < 15 && styles.buttonDisabled]}
                  disabled={level < 15}
                  onPress={() => {
                    if (level < 15) Alert.alert('Darkweb-App freigeschaltet ab Level 15');
                    else { setPhoneMenuVisible(false); setDarkwebModalVisible(true); }
                  }}
                >
                  <Image source={require('./assets/darkweb.png')} style={styles.phoneAppImage} />
                </TouchableOpacity>
                <View style={styles.phoneAppPlaceholder} />
              </View>
            </View>
            <View style={styles.phoneTimeContainer}>
              <Text style={styles.phoneTimeText}>{currentTime.toLocaleTimeString()}</Text>
            </View>
            <TouchableOpacity style={styles.phoneHomeButton} onPress={() => setPhoneMenuVisible(false)} />
            <View style={styles.batteryContainer}>
              <View style={[styles.batteryLevel, { width: `${batteryLevel}%` }]} />
            </View>
          </View>
        </View>
      </Modal>
      <Modal visible={darkwebModalVisible} animationType="slide" transparent>
        <View style={styles.modalContainer}>
          <ImageBackground source={require('./assets/matrix.png')} style={[styles.modalContent, { height: '80%', overflow: 'hidden', padding: 0 }]} imageStyle={{ borderRadius: 15, transform: [{ scale: 2 }] }} resizeMode="cover">
            <View style={{ flex: 1, width: '100%', padding: 15 }}>
              <Image source={require('./assets/darkwebtitel.png')} style={{ height: 120, width: '100%', resizeMode: 'contain', marginBottom: 10 }} />
              <View style={styles.chatHeader}>
                <View style={styles.chatHeaderName}>
                  <Text style={styles.chatHeaderNameText}>Chats</Text>
                </View>
                <View style={styles.chatHeaderTitle}>
                  <Text style={styles.chatHeaderTitleText}>
                    {chatThreads.find(th => th.id === selectedThreadId)?.name}
                  </Text>
                </View>
              </View>
              <View style={{ flex: 1, flexDirection: 'row' }}>
                {/* Chat list */}
                <View style={styles.chatListContainer}>
                  <ScrollView>
                    {chatThreads.map(th => (
                      <TouchableOpacity key={th.id} onPress={() => setSelectedThreadId(th.id)}>
                        <Text style={[styles.threadTitle, selectedThreadId === th.id && styles.threadSelected]}>
                          {th.name}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
                {/* Chat window */}
                <View style={styles.chatWindowContainer}>
                  <ScrollView contentContainerStyle={styles.chatContent}>
                    {chatThreads.find(th => th.id === selectedThreadId)?.logs.map(msgObj => (
                      <View key={msgObj.id} style={[
                          styles.messageBubble,
                          msgObj.type === 'user' ? styles.bubbleUser :
                          msgObj.type === 'customer' ? styles.bubbleCustomer :
                          styles.bubbleSystem
                        ]}>
                        <Text style={[styles.bubbleText, msgObj.type === 'user' ? styles.bubbleUserText : styles.bubbleCustomerText]}>{msgObj.text}</Text>
                      </View>
                    ))}
                  </ScrollView>
                  <View style={styles.inputContainer}>
                    <TouchableOpacity style={styles.sendButton} onPress={() => handleSend(inputText)}>
                      <Ionicons name="send" size={24} color="#fff" />
                    </TouchableOpacity>
                    <TextInput
                      style={styles.textInput}
                      placeholder="Antwort"
                      placeholderTextColor="#ccc"
                      value={inputText}
                      onChangeText={setInputText}
                    />
                  </View>
                </View>
              </View>
              <TouchableOpacity style={styles.closeSlotButton} onPress={() => setDarkwebModalVisible(false)}>
                <Text style={styles.closeSlotButtonText}>Schließen</Text>
              </TouchableOpacity>
            </View>
          </ImageBackground>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 41,
    position: 'relative',
  },
  leftIconsContainer: {
    position: 'absolute',
    left: 10,
    top: 60,
    flexDirection: 'row',
    alignItems: 'center',
  },
  shopIcon: { marginRight: 10, marginTop: 0.3 },
  rightIconsContainer: {
    position: 'absolute',
    right: 10,
    top: 60,
    flexDirection: 'row',
    alignItems: 'center',
  },
  rightIconSpacing: { marginLeft: 20 },
  titleImage: { width: 220, height: 90 },
  scrollViewContainer: { paddingBottom: 100, paddingHorizontal: 20 },
  moneyLevelContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginTop: 20,
  },
  moneyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  xpContainer: {
    alignItems: 'center',
    backgroundColor: '#333',
    padding: 10,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#FFD700',
  },
  xpText: { color: '#fff', fontSize: 20 },
  xpBar: {
    width: 150,
    height: 20,
    backgroundColor: '#555',
    borderRadius: 10,
    marginVertical: 5,
    overflow: 'hidden',
  },
  xpFill: { height: '100%', backgroundColor: '#FFD700' },
  stat: { color: '#fff', fontSize: 20, marginVertical: 4 },
  button: {
    backgroundColor: '#000',
    padding: 12,
    borderRadius: 10,
    marginTop: 10,
  },
  buttonText: { color: '#FFD700', fontWeight: 'bold', fontSize: 20 },
  icon: { width: 21, height: 21, marginTop: 2 },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: 5,
    paddingBottom: 5,
  },
  itemRowNoLine: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: 5,
    paddingBottom: 5,
    width: '100%',
  },
  itemRowLeft: { flexDirection: 'row', alignItems: 'center' },
  itemRowRight: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end' },
  categoryContainer: { marginTop: 30, width: '100%' },
  categoryContent: { marginBottom: 20, paddingLeft: 10 },
  upgradeCostButton: { backgroundColor: '#000', padding: 10, borderRadius: 10 },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    backgroundColor: '#222',
    padding: 15,
    borderRadius: 15,
    alignItems: 'center',
  },
  settingsTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  musicControls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '60%',
    marginTop: 10,
  },
  playerBox: {
    marginTop: 20,
    padding: 10,
    borderWidth: 2,
    borderColor: '#FFD700',
    borderRadius: 10,
    width: '100%',
    alignItems: 'center',
    backgroundColor: '#333',
  },
  volumeContainer: { marginTop: 10, width: '80%', alignItems: 'center' },
  levelUpContainer: {
    position: 'absolute',
    top: 130,
    alignSelf: 'center',
    backgroundColor: 'rgba(255,215,0,0.8)',
    padding: 10,
    borderRadius: 10,
    zIndex: 1000,
    elevation: 20,
  },
  levelUpText: { color: '#000', fontSize: 20, fontWeight: 'bold' },
  slotMachineContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginVertical: 20,
  },
  reelContainer: {
    width: fruitHeight,
    height: fruitHeight,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#FFD700',
    borderRadius: 5,
  },
  fruitImage: { width: fruitHeight, height: fruitHeight, resizeMode: 'contain' },
  slotBetContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: '100%', paddingHorizontal: 20, marginVertical: 5 },
  slotBetText: { fontSize: 14, color: '#fff' },
  slotSquareButton: { width: 30, height: 30, borderRadius: 5, borderWidth: 2, borderColor: '#FFD700', backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' },
  slotSquareText: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
  slotRectButton: { width: 50, height: 30, borderRadius: 5, borderWidth: 2, borderColor: '#FFD700', backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' },
  slotRectText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  questLine: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    marginVertical: 10,
  },
  questDescriptionContainer: { flex: 1, },
  questDescription: { fontSize: 12, color: '#fff' },
  questProgressContainer: { width: 40, alignItems: 'center' },
  questProgressText: { fontSize: 12, color: '#fff', textAlign: 'center' },
  rewardButton: {
    backgroundColor: '#666',
    padding: 6,
    borderRadius: 6,
    marginLeft: 10,
  },
  questButtonText: { fontSize: 12, color: '#fff', fontWeight: 'bold' },
  questButtonTextSmall: { fontSize: 12 },
  phoneModalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  phoneDevice: {
    width: 200,
    height: 400,
    backgroundColor: '#000',
    borderRadius: 15,
    borderWidth: 10,
    borderColor: '#444',
    overflow: 'hidden',
  },
  phoneIconsContainer: {
    position: 'absolute',
    top: '35%',
    width: '100%',
    paddingHorizontal: 10,
    alignItems: 'center',
  },
  phoneIconsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginVertical: 5,
  },
  phoneAppIcon: {
    width: 40,
    height: 40,
    backgroundColor: '#4A5568',
    borderRadius: 6,
    margin: 5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  phoneAppImage: {
    width: 24,
    height: 24,
    resizeMode: 'contain',
  },
  phoneAppPlaceholder: {
    width: 40,
    height: 40,
    margin: 5,
  },
  phoneTimeContainer: {
    position: 'absolute',
    top: '20%',
    alignSelf: 'center',
    width: 150,
  },
  phoneTimeText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  phoneHomeButton: {
    width: 25,
    height: 25,
    borderRadius: 12.5,
    backgroundColor: '#555',
    position: 'absolute',
    bottom: 1,
    alignSelf: 'center',
  },
  batteryContainer: { position: 'absolute', top: 5, right: 5, width: 40, height: 10, borderWidth: 1, borderColor: '#fff', borderRadius: 2, overflow: 'hidden' },
  batteryLevel: { height: '100%', backgroundColor: '#0f0' },
  headerIcons: {
    flexDirection: 'row',
    position: 'absolute',
    right: 10,
    alignItems: 'center',
  },
  headerIcon: {
    marginHorizontal: 0.5,
  },
  categoryTitle: { fontSize: 18, color: '#fff', marginBottom: 10 },
  itemIcon: { width: 20, height: 20, marginRight: 10 },
  itemName: { fontSize: 16, color: '#fff' },
  itemPrice: { fontSize: 16, color: '#fff' },
  upgradeButtonText: { fontSize: 16, color: '#fff' },
  slotResultText: { fontSize: 16, color: '#fff', marginTop: 10 },
  slotActionsContainer: { marginTop: 20, alignItems: 'center' },
  autoSpinButton: { backgroundColor: '#FFD700', padding: 10, borderRadius: 8, marginBottom: 10 },
  autoSpinButtonText: { color: '#000', fontSize: 16, fontWeight: 'bold' },
  closeSlotButton: { backgroundColor: '#000', padding: 10, borderRadius: 10 },
  closeSlotButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  slotSpinButton: { backgroundColor: 'red', padding: 10, borderRadius: 8, marginBottom: 10 },
  slotSpinButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  slotHeaderImage: { width: 205, height: 85, resizeMode: 'contain', marginBottom: 10 },
  settingLabel: { color: '#fff', fontSize: 16, marginTop: 10 },
  slider: { width: '80%', height: 40, marginVertical: 10 },
  playerContainer: { width: '100%', padding: 10, backgroundColor: '#333', borderRadius: 10, alignItems: 'center', marginVertical: 10 },
  playerSongTitle: { color: '#fff', fontSize: 16, marginBottom: 5 },
  playerControls: { flexDirection: 'row', justifyContent: 'space-around', width: '60%' },
  playerButton: { backgroundColor: '#000', padding: 8, borderRadius: 8 },
  playerButtonText: { color: '#FFD700', fontSize: 18 },
  buttonDisabled: { opacity: 0.5 },
  timerText: { color: '#FFD700', fontSize: 14, marginVertical: 10, textAlign: 'center' },
  categoryButton: { backgroundColor: '#444', padding: 8, borderRadius: 6, marginVertical: 8, width: '100%' },
  categoryButtonText: { color: '#FFD700', fontSize: 14, fontWeight: 'bold', textAlign: 'center' },
  achievementLine: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-start', marginVertical: 5 },
  achievementTitle: { flex: 1, color: '#fff', fontSize: 12 },
  achievementCondition: { flex: 1, color: '#fff', fontSize: 12, textAlign: 'center' },
  achievementReward: { width: 60, color: '#fff', fontSize: 12, textAlign: 'right' },
  headerLine: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginVertical: 4 },
  headerTitle: { flex: 1, fontSize: 12, color: '#FFD700', fontWeight: 'bold' },
  headerCondition: { flex: 1, fontSize: 12, color: '#FFD700', textAlign: 'center', fontWeight: 'bold' },
  headerReward: { width: 60, fontSize: 12, color: '#FFD700', textAlign: 'right', fontWeight: 'bold' },
  smallText: { fontSize: 10 },
  categoryHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginVertical: 8, width: '100%' },
  collectButton: { backgroundColor: '#000', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 8 },
  collectButtonText: { color: '#FFD700', fontWeight: 'bold', fontSize: 14 },
  currencyWrapper: {
    flexDirection: 'column',
  },
  terminal: { backgroundColor: '#000', borderRadius: 8, padding: 5, height: 80, marginVertical: 5, width: '100%' },
  terminalText: { color: '#0f0', fontFamily: 'monospace', fontSize: 12 },
  matrixText: {
    color: '#00FF00',
    fontFamily: 'monospace',
    fontSize: 12,
    lineHeight: 20,
    textAlign: 'left',
  },
  matrixButtonContainer: {
    position: 'absolute',
    top: '50%',
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  matrixButton: {
    padding: 10,
    backgroundColor: 'rgba(0,255,0,0.2)',
    borderRadius: 5,
  },
  matrixButtonText: {
    color: '#00FF00',
    fontWeight: 'bold',
  },
  darkwebButton: {
    color: '#00FF00',
    fontSize: 18,
    backgroundColor: 'transparent',
    marginVertical: 10,
  },
  chatContainer: {
    flex: 1,
    width: '100%',
    padding: 10,
  },
  chatContent: {
    paddingBottom: 20,
  },
  chatText: {
    color: '#00FF00',
    fontFamily: 'monospace',
    fontSize: 12,
    marginVertical: 2,
  },
  responseContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 10,
  },
  responseButton: {
    color: '#0f0',
    fontFamily: 'monospace',
    fontSize: 14,
    backgroundColor: 'rgba(0,255,0,0.1)',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 5,
  },
  threadList: {
    flexDirection: 'column',
    marginVertical: 5,
  },
  threadTitle: {
    color: '#0f0',
    fontFamily: 'monospace',
    fontSize: 12,
    marginHorizontal: 8,
  },
  threadSelected: {
    textDecorationLine: 'underline',
    fontWeight: 'bold',
  },
  messageBubble: {
    padding: 10,
    marginVertical: 6,
    maxWidth: '75%',
    borderRadius: 0,
  },
  bubbleCustomer: {
    alignSelf: 'flex-start',
    backgroundColor: '#000',
    borderRadius: 0,
  },
  bubbleUser: {
    alignSelf: 'flex-end',
    backgroundColor: '#0a0',
    borderRadius: 0,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    backgroundColor: '#0a0',
    borderBottomLeftRadius: 15,
    borderBottomRightRadius: 15,
  },
  textInput: {
    flex: 1,
    backgroundColor: '#0a0',
    borderRadius: 20,
    paddingHorizontal: 15,
    color: '#fff',
    height: 40,
  },
  sendButton: {
    marginLeft: 8,
  },
  sendIcon: {
    width: 24,
    height: 24,
    tintColor: '#0a0',
  },
  chatListContainer: {
    width: '30%',
    backgroundColor: '#111',
    padding: 10,
    borderWidth: 1,
    borderColor: '#0a0',
    borderRadius: 10,
  },
  chatHeader: {
    flexDirection: 'row',
    width: '100%',
    height: 40,
    marginBottom: 10,
    borderTopLeftRadius: 15,
    borderTopRightRadius: 15,
    overflow: 'hidden',
  },
  chatHeaderName: {
    width: 80,
    backgroundColor: '#0a0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  chatHeaderNameText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  chatHeaderTitle: {
    flex: 1,
    backgroundColor: '#0a0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  chatHeaderTitleText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  bubbleText: {
    fontSize: 12,
  },
  bubbleCustomerText: {
    color: '#fff',
  },
  bubbleUserText: {
    color: '#000',
  },
});
