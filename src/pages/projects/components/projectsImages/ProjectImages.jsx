/* eslint-disable no-nested-ternary */
/* eslint-disable react/no-array-index-key */
import { Fragment, useCallback } from 'react';

import Image from 'next/image';
import PropTypes from 'prop-types';
import clsx from 'clsx';
import styles from '@src/pages/projects/components/projectsImages/styles/projectImages.module.scss';
import useIsMobile from '@src/hooks/useIsMobile';

function ProjectImages({ project }) {
  const isMobile = useIsMobile();

  const renderMediaContainer = useCallback(
    ({ tag, src, isRight, index, title, width, height }) => {
      if (tag === 'video') {
        return (
          <div className={styles.videoContainer}>
            <video loop muted autoPlay>
              <source src={src} type="video/mp4" />
            </video>
          </div>
        );
      }
      if (tag === 'small') {
        return (
          <div
            style={{
              gridColumn: !isMobile ? (!isRight ? '1 / 9' : ' 9 / 17') : !isRight ? '1 / 4' : ' 4 / 7',
            }}
            className={styles.imageContainer}
          >
            <Image priority sizes="100%" src={src} fill alt={`图片-${title}-${index}`} />
          </div>
        );
      }
      if (tag === 'big') {
        return (
          <div className={styles.bigContainer}>
            <Image priority sizes="100%" src={src} fill alt={`图片-${title}-${index}`} />
          </div>
        );
      }
      if (tag === 'medium') {
        return (
          <div className={styles.mediumContainer}>
            <Image priority sizes="100%" src={src} fill alt={`图片-${title}-${index}`} />
          </div>
        );
      }
      if (tag === 'screenshot') {
        return (
          <div style={{ aspectRatio: `${width} / ${height}` }} className={styles.screenshotContainer}>
            <Image priority sizes="100%" src={src} fill alt={`图片-${title}-${index}`} />
          </div>
        );
      }
      if (tag === 'mobile') {
        return (
          <div style={{ gridColumn: !isRight ? '1 / 9' : '9 / 17' }} className={styles.mobileContainer}>
            <Image priority sizes="50vw" src={src} fill alt={`移动端图片-${title}-${index}`} />
          </div>
        );
      }
      return null;
    },
    [isMobile],
  );

  return (
    <section className={clsx(styles.root, 'layout-grid-inner')}>
      {project.images.map((image, index) => (
        <Fragment key={`${project.title}-image-${index}`}>{renderMediaContainer({ ...image, index, title: project.title })}</Fragment>
      ))}
    </section>
  );
}

ProjectImages.propTypes = {
  project: PropTypes.shape({
    title: PropTypes.string.isRequired,
    images: PropTypes.arrayOf(
      PropTypes.shape({
        tag: PropTypes.string.isRequired,
        src: PropTypes.string.isRequired,
        isRight: PropTypes.bool,
        width: PropTypes.number,
        height: PropTypes.number,
      }),
    ).isRequired,
  }).isRequired,
};

export default ProjectImages;
