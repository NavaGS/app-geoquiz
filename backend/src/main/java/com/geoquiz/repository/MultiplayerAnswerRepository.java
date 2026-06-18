package com.geoquiz.repository;

import com.geoquiz.entity.MultiplayerAnswer;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;
import java.util.UUID;

public interface MultiplayerAnswerRepository extends JpaRepository<MultiplayerAnswer, UUID> {
    Optional<MultiplayerAnswer> findByPlayerIdAndQuestionIndex(UUID playerId, int questionIndex);
}
