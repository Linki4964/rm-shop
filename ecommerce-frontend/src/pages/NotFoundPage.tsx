import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation, useSearchParams } from 'react-router-dom';

import styles from './NotFoundPage.module.css';

const GAME_WIDTH = 640;
const GAME_HEIGHT = 220;
const GROUND_Y = 172;
const DINO_LEFT = 52;
const DINO_WIDTH = 38;
const DINO_HEIGHT = 42;
const GRAVITY = 0.72;
const JUMP_FORCE = -12.8;
const BASE_SPEED = 6.1;

type Obstacle = {
  id: number;
  x: number;
  width: number;
  height: number;
};

function randomBetween(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export default function NotFoundPage() {
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const missingPath = useMemo(() => searchParams.get('from') || location.pathname, [location.pathname, searchParams]);

  const rafRef = useRef<number | null>(null);
  const obstacleIdRef = useRef(0);
  const dinoYRef = useRef(0);
  const velocityRef = useRef(0);
  const scoreRef = useRef(0);
  const speedRef = useRef(BASE_SPEED);
  const spawnTimerRef = useRef(12);
  const runningRef = useRef(false);

  const [hasStarted, setHasStarted] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const [dinoY, setDinoY] = useState(0);
  const [obstacles, setObstacles] = useState<Obstacle[]>([]);
  const [score, setScore] = useState(0);

  useEffect(() => {
    dinoYRef.current = dinoY;
  }, [dinoY]);

  useEffect(() => {
    scoreRef.current = score;
  }, [score]);

  useEffect(() => {
    runningRef.current = isRunning;
  }, [isRunning]);

  const spawnObstacle = () => {
    const height = randomBetween(36, 68);
    const width = randomBetween(20, 34);

    return {
      id: obstacleIdRef.current++,
      x: GAME_WIDTH + randomBetween(0, 48),
      width,
      height,
    };
  };

  const startRound = (withJump = false) => {
    if (!hasStarted) {
      setHasStarted(true);
      setObstacles([spawnObstacle()]);
      spawnTimerRef.current = randomBetween(54, 92);
    }

    if (!runningRef.current) {
      runningRef.current = true;
      setIsRunning(true);
    }

    if (withJump && dinoYRef.current === 0) {
      velocityRef.current = JUMP_FORCE;
    }
  };

  const restartGame = () => {
    velocityRef.current = 0;
    dinoYRef.current = 0;
    scoreRef.current = 0;
    speedRef.current = BASE_SPEED;
    spawnTimerRef.current = randomBetween(40, 64);
    obstacleIdRef.current = 0;
    runningRef.current = true;
    setHasStarted(true);
    setDinoY(0);
    setObstacles([spawnObstacle()]);
    setScore(0);
    setIsGameOver(false);
    setIsRunning(true);
  };

  useEffect(() => {
    const jump = () => {
      if (!hasStarted) {
        startRound(true);
        return;
      }

      if (isGameOver) {
        restartGame();
        return;
      }

      if (dinoYRef.current === 0) {
        startRound(true);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.code === 'Space' || event.code === 'ArrowUp') {
        event.preventDefault();
        jump();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [hasStarted, isGameOver]);

  useEffect(() => {
    const tick = () => {
      if (runningRef.current) {
        velocityRef.current += GRAVITY;
        let nextY = dinoYRef.current - velocityRef.current;

        if (nextY < 0) {
          nextY = 0;
          velocityRef.current = 0;
        }

        dinoYRef.current = nextY;
        setDinoY(nextY);

        speedRef.current = Math.min(BASE_SPEED + scoreRef.current / 220, 11.6);
        spawnTimerRef.current -= 1;

        setObstacles((prev) => {
          let next = prev
            .map((obstacle) => ({
              ...obstacle,
              x: obstacle.x - speedRef.current,
            }))
            .filter((obstacle) => obstacle.x + obstacle.width > -24);

          if (spawnTimerRef.current <= 0) {
            next = [...next, spawnObstacle()];
            spawnTimerRef.current = randomBetween(44, 86);
          }

          const dinoTop = GROUND_Y - DINO_HEIGHT - dinoYRef.current;
          const dinoBottom = dinoTop + DINO_HEIGHT;
          const dinoRight = DINO_LEFT + DINO_WIDTH;

          const hasCollision = next.some((obstacle) => {
            const obstacleLeft = obstacle.x;
            const obstacleRight = obstacle.x + obstacle.width;
            const obstacleTop = GROUND_Y - obstacle.height;
            const obstacleBottom = GROUND_Y;

            const horizontalHit = dinoRight > obstacleLeft && DINO_LEFT < obstacleRight;
            const verticalHit = dinoBottom > obstacleTop && dinoTop < obstacleBottom;

            return horizontalHit && verticalHit;
          });

          if (hasCollision) {
            runningRef.current = false;
            setIsRunning(false);
            setIsGameOver(true);
          }

          return next;
        });

        if (runningRef.current) {
          setScore((prev) => prev + 1);
        }
      }

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, []);

  return (
    <main className={styles.page}>
      <div className={styles.shell}>
        <section className={styles.copy}>
          <span className={styles.kicker}>PAGE NOT FOUND</span>
          <h1 className={styles.code}>404</h1>
          <h2 className={styles.title}>这个路由不存在</h2>
          <p className={styles.description}>
            你访问的地址 <code>{missingPath}</code> 没有匹配到页面。先别急着返回，下面顺手跑一局小恐龙。
          </p>
          <div className={styles.actions}>
            <Link className={styles.primaryAction} to="/">
              回到首页
            </Link>
            <button className={styles.secondaryAction} type="button" onClick={restartGame}>
              重新开始
            </button>
          </div>
          <p className={styles.tip}>操作方式：按空格、方向键上，或者直接点击游戏区域跳跃。</p>
        </section>

        <section className={styles.gameCard}>
          <div className={styles.gameTopbar}>
            <span>Chrome Dino Mini</span>
            <span className={styles.score}>Score {Math.floor(score / 6)}</span>
          </div>

          <button
            className={styles.gameArea}
            type="button"
            onClick={() => {
              if (!hasStarted) {
                startRound(true);
                return;
              }

              if (isGameOver) {
                restartGame();
                return;
              }

              if (dinoYRef.current === 0) {
                startRound(true);
              }
            }}
          >
            <div className={styles.skyGlow} />
            <div className={styles.sun} />
            <div className={styles.track} />

            <div
              className={styles.dino}
              style={{
                left: `${DINO_LEFT}px`,
                bottom: `${GAME_HEIGHT - GROUND_Y + dinoY}px`,
                width: `${DINO_WIDTH}px`,
                height: `${DINO_HEIGHT}px`,
              }}
            >
              <span className={styles.dinoEye} />
              <span className={styles.dinoLegFront} />
              <span className={styles.dinoLegBack} />
            </div>

            {obstacles.map((obstacle) => (
              <div
                key={obstacle.id}
                className={styles.obstacle}
                style={{
                  left: `${obstacle.x}px`,
                  width: `${obstacle.width}px`,
                  height: `${obstacle.height}px`,
                }}
              >
                <span />
                <span />
              </div>
            ))}

            <div className={styles.groundLine} />

            {!hasStarted ? (
              <div className={styles.overlay}>
                <strong>Ready?</strong>
                <span>点击这里或按空格开始</span>
              </div>
            ) : null}

            {isGameOver ? (
              <div className={styles.overlay}>
                <strong>Game Over</strong>
                <span>点击这里或下方按钮重新开始</span>
              </div>
            ) : null}
          </button>
        </section>
      </div>
    </main>
  );
}
