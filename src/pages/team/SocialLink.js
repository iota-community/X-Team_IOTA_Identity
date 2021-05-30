import React from 'react';
import styles from './styles.module.css';
import { GithubIcon } from './icons/Github';
import { TwitterIcon } from './icons/Twitter';
import { DiscordIcon } from './icons/Discord';

export function SocialLink(props) {
  const { type, link, label } = props;
  console.log("type", type);
  let icon;
  if (type === 'github') {
    icon = <GithubIcon />
  } else if (type === 'twitter') {
    icon = <TwitterIcon />
  } else if (type === 'discord') {
    icon = <DiscordIcon />
  }

  if (link) {
    return (
      <a className={styles.socialLink} href={link}>{icon}</a>
    )
  }
  return (
    <div className={styles.socialLink}>
      {icon}
      <span className={styles.socialLinkLabel} >{label}</span>
    </div>
  )
}