// components/Logo.js
import Image from 'next/image';
import styles from './Logo.module.css';

export default function Logo() {
    return (
        <Image
            src="/logo.png"
            alt="Crystal The Developer Logo"
            width={140}
            height={40}
            className={styles.logo}
        />
    );
}
