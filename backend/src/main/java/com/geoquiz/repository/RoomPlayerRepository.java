package com.geoquiz.repository;

import com.geoquiz.entity.RoomPlayer;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface RoomPlayerRepository extends JpaRepository<RoomPlayer, UUID> {
    List<RoomPlayer> findByRoomIdAndIsActiveTrue(UUID roomId);
    List<RoomPlayer> findByRoomIdOrderByScoreDesc(UUID roomId);
    Optional<RoomPlayer> findByRoomIdAndHostToken(UUID roomId, UUID hostToken);
}
