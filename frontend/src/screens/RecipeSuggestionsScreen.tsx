import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card, Title, Paragraph, Button, Chip, Searchbar } from 'react-native-paper';
import { Recipe } from '../types';
import apiService from '../services/api';

interface RecipeSuggestionsScreenProps {
  navigation: any;
}

const RecipeSuggestionsScreen: React.FC<RecipeSuggestionsScreenProps> = ({ navigation }) => {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [filteredRecipes, setFilteredRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string | null>(null);

  useEffect(() => {
    loadRecipeSuggestions();
  }, []);

  useEffect(() => {
    filterRecipes();
  }, [recipes, searchQuery, selectedDifficulty]);

  const loadRecipeSuggestions = async () => {
    try {
      setLoading(true);
      
      // Get expiring items to suggest recipes
      const expiringResponse = await apiService.getExpiringItems(7);
      const expiringItems = expiringResponse.success ? expiringResponse.data || [] : [];
      
      // Extract ingredient names
      const ingredients = expiringItems.map(item => item.name);
      
      if (ingredients.length === 0) {
        // If no expiring items, use some default ingredients
        ingredients.push('tomato', 'chicken', 'pasta', 'cheese');
      }
      
      // Get recipe suggestions
      const response = await apiService.getRecipeSuggestions(ingredients);
      
      if (response.success && response.data) {
        setRecipes(response.data);
      }
    } catch (error) {
      console.error('Failed to load recipe suggestions:', error);
      Alert.alert('Error', 'Failed to load recipe suggestions. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadRecipeSuggestions();
    setRefreshing(false);
  };

  const filterRecipes = () => {
    let filtered = [...recipes];

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(recipe =>
        recipe.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        recipe.ingredients.some(ingredient =>
          ingredient.toLowerCase().includes(searchQuery.toLowerCase())
        )
      );
    }

    // Difficulty filter
    if (selectedDifficulty) {
      filtered = filtered.filter(recipe => recipe.difficulty === selectedDifficulty);
    }

    setFilteredRecipes(filtered);
  };

  const renderRecipe = (recipe: Recipe) => (
    <Card key={recipe.id} style={styles.recipeCard} onPress={() => navigation.navigate('RecipeDetail', { recipeId: recipe.id })}>
      <Card.Content>
        <View style={styles.recipeHeader}>
          <Title style={styles.recipeTitle}>{recipe.title}</Title>
          <Chip style={styles.difficultyChip} mode="outlined">
            {recipe.difficulty}
          </Chip>
        </View>
        
        <View style={styles.recipeInfo}>
          <Text style={styles.recipeInfoText}>
            ⏱️ {recipe.prepTime + recipe.cookTime} min • 👥 {recipe.servings} servings
          </Text>
        </View>
        
        <Paragraph style={styles.recipeIngredients}>
          <Text style={styles.ingredientsLabel}>Ingredients: </Text>
          {recipe.ingredients.slice(0, 3).join(', ')}
          {recipe.ingredients.length > 3 && '...'}
        </Paragraph>
        
        {recipe.matchingIngredients && recipe.matchingIngredients.length > 0 && (
          <View style={styles.matchingIngredients}>
            <Text style={styles.matchingLabel}>Matching your ingredients:</Text>
            <View style={styles.ingredientChips}>
              {recipe.matchingIngredients.map((ingredient, index) => (
                <Chip key={index} style={styles.ingredientChip} mode="outlined">
                  {ingredient}
                </Chip>
              ))}
            </View>
          </View>
        )}
      </Card.Content>
    </Card>
  );

  const renderDifficultyFilter = () => (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterContainer}>
      <Chip
        selected={selectedDifficulty === null}
        onPress={() => setSelectedDifficulty(null)}
        style={styles.filterChip}
      >
        All Levels
      </Chip>
      <Chip
        selected={selectedDifficulty === 'easy'}
        onPress={() => setSelectedDifficulty('easy')}
        style={styles.filterChip}
      >
        Easy
      </Chip>
      <Chip
        selected={selectedDifficulty === 'medium'}
        onPress={() => setSelectedDifficulty('medium')}
        style={styles.filterChip}
      >
        Medium
      </Chip>
      <Chip
        selected={selectedDifficulty === 'hard'}
        onPress={() => setSelectedDifficulty('hard')}
        style={styles.filterChip}
      >
        Hard
      </Chip>
    </ScrollView>
  );

  const renderEmptyState = () => (
    <Card style={styles.emptyCard}>
      <Card.Content>
        <Title style={styles.emptyTitle}>No recipes found</Title>
        <Paragraph style={styles.emptyText}>
          {searchQuery || selectedDifficulty
            ? 'Try adjusting your search or filters'
            : 'Add some food items to get recipe suggestions!'}
        </Paragraph>
        <Button
          mode="contained"
          onPress={() => navigation.navigate('AddItem')}
          style={styles.addItemButton}
        >
          Add Food Items
        </Button>
      </Card.Content>
    </Card>
  );

  const renderStats = () => {
    const totalRecipes = filteredRecipes.length;
    const easyRecipes = filteredRecipes.filter(r => r.difficulty === 'easy').length;
    const quickRecipes = filteredRecipes.filter(r => r.prepTime + r.cookTime <= 30).length;

    return (
      <Card style={styles.statsCard}>
        <Card.Content>
          <Title>Recipe Overview</Title>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{totalRecipes}</Text>
              <Text style={styles.statLabel}>Total Recipes</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statNumber, { color: '#4caf50' }]}>{easyRecipes}</Text>
              <Text style={styles.statLabel}>Easy</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statNumber, { color: '#ff9800' }]}>{quickRecipes}</Text>
              <Text style={styles.statLabel}>Quick (≤30min)</Text>
            </View>
          </View>
        </Card.Content>
      </Card>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Recipe Suggestions</Text>
        <Text style={styles.headerSubtitle}>Cook with your expiring ingredients</Text>
      </View>

      <Searchbar
        placeholder="Search recipes..."
        onChangeText={setSearchQuery}
        value={searchQuery}
        style={styles.searchBar}
      />

      {renderDifficultyFilter()}
      {renderStats()}

      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {filteredRecipes.length === 0 ? (
          renderEmptyState()
        ) : (
          filteredRecipes.map(renderRecipe)
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    padding: 20,
    backgroundColor: '#fff',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#666',
    marginTop: 4,
  },
  searchBar: {
    margin: 16,
    elevation: 2,
  },
  filterContainer: {
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  filterChip: {
    marginRight: 8,
  },
  statsCard: {
    margin: 16,
    elevation: 2,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 16,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  scrollView: {
    flex: 1,
  },
  recipeCard: {
    margin: 16,
    marginTop: 8,
    elevation: 2,
  },
  recipeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  recipeTitle: {
    fontSize: 18,
    flex: 1,
  },
  difficultyChip: {
    marginLeft: 8,
  },
  recipeInfo: {
    marginBottom: 8,
  },
  recipeInfoText: {
    fontSize: 14,
    color: '#666',
  },
  recipeIngredients: {
    fontSize: 14,
    color: '#333',
    marginBottom: 8,
  },
  ingredientsLabel: {
    fontWeight: 'bold',
  },
  matchingIngredients: {
    marginTop: 8,
  },
  matchingLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#4caf50',
    marginBottom: 4,
  },
  ingredientChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  ingredientChip: {
    marginRight: 4,
    marginBottom: 4,
  },
  emptyCard: {
    margin: 16,
    elevation: 2,
  },
  emptyTitle: {
    textAlign: 'center',
    color: '#666',
  },
  emptyText: {
    textAlign: 'center',
    color: '#666',
    fontStyle: 'italic',
    marginTop: 8,
    marginBottom: 16,
  },
  addItemButton: {
    marginTop: 8,
  },
});

export default RecipeSuggestionsScreen;



