package com.cmpt276.jugglingclub.models;

import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SynchroProjectRepository extends JpaRepository<SynchroProject, Long> {

    List<SynchroProject> findAllByOwnerUidOrderByCreatedAtDesc(int ownerUid);

    Optional<SynchroProject> findByIdAndOwnerUid(Long id, int ownerUid);
}
