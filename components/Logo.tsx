// components/Logo.tsx
import Image from 'next/image';
import styles from './css/Logo.module.css';

export default function Logo() {
    return (
        <Image
            src="/logo.png"
            alt="Crystal The Developer Inc. Logo"
            width={140}
            height={40}
            className={styles.logo}
        />
    );
}
