import Image from "next/image";
import styles from "./page.module.css";
import React from 'react';
import Login from './login';

export default function Home() {
  return (
    <>
    <div className={styles.page}><h1>Hello</h1><h2>我是吳濟聰hahahaha</h2></div>
    <div className={styles.container}><Login /></div>
    </>
  )
}
