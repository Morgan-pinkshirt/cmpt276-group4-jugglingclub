package com.cmpt276.jugglingclub.models;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

@Repository
public interface VideoTutorialRepository
        extends JpaRepository<VideoTutorial, Long> {

    interface VideoSummary {

        Long getId();

        String getTitle();

        String getDescription();

        String getFileName();

        String getContentType();

        Long getFileSize();

        Integer getUploadedBy();

        Instant getCreatedAt();
    }

    @Query("""
            SELECT
                v.id AS id,
                v.title AS title,
                v.description AS description,
                v.fileName AS fileName,
                v.contentType AS contentType,
                v.fileSize AS fileSize,
                v.uploadedBy AS uploadedBy,
                v.createdAt AS createdAt
            FROM VideoTutorial v
            ORDER BY v.createdAt DESC, v.id DESC
            """)
    List<VideoSummary> findAllVideoSummaries();

    @Query("""
            SELECT
                v.id AS id,
                v.title AS title,
                v.description AS description,
                v.fileName AS fileName,
                v.contentType AS contentType,
                v.fileSize AS fileSize,
                v.uploadedBy AS uploadedBy,
                v.createdAt AS createdAt
            FROM VideoTutorial v
            WHERE v.id = :id
            """)
    Optional<VideoSummary> findVideoSummaryById(
            @Param("id") Long id
    );

    @Query(
            value = """
                    SELECT video_data
                    FROM video_tutorials
                    WHERE id = :id
                    """,
            nativeQuery = true
    )
    Optional<byte[]> findVideoDataById(
            @Param("id") Long id
    );

    @Query(
            value = """
                    SELECT substring(
                        video_data,
                        :startPosition,
                        :length
                    )
                    FROM video_tutorials
                    WHERE id = :id
                    """,
            nativeQuery = true
    )
    Optional<byte[]> findVideoDataRange(
            @Param("id") Long id,
            @Param("startPosition") int startPosition,
            @Param("length") int length
    );
}

